const { Pool } = require("pg");
const { migrations } = require("./migrations");

const CONNECTION_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_PRISMA_URL",
];
const MAX_JSON_BODY_BYTES = 64 * 1024;
const LATEST_MIGRATION_ID = migrations.at(-1)?.id;

let pool;
let migrationsReadyPromise;

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

module.exports = async function handler(req, res) {
  const requestId = getRequestId(req);
  setBaseHeaders(res, requestId);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const method = (req.method || "GET").toUpperCase();
    const path = getRequestPath(req);

    if (method === "GET" && path === "/api/healthz") {
      await handleHealth(res);
      return;
    }

    await ensureMigrationsApplied();

    if (method === "GET" && path === "/api/employees") {
      sendJson(res, 200, await listEmployees());
      return;
    }

    if (method === "POST" && path === "/api/employees") {
      const body = await readJsonBody(req);
      sendJson(res, 201, await createEmployee(parseEmployeeInput(body, false)));
      return;
    }

    const employeeMatch = path.match(/^\/api\/employees\/(\d+)$/);
    if (employeeMatch) {
      const id = parseId(employeeMatch[1]);

      if (method === "GET") {
        sendJson(res, 200, await getEmployee(id));
        return;
      }

      if (method === "PATCH") {
        const body = await readJsonBody(req);
        sendJson(res, 200, await updateEmployee(id, parseEmployeeInput(body, true)));
        return;
      }

      if (method === "DELETE") {
        await deleteEmployee(id);
        res.statusCode = 204;
        res.end();
        return;
      }
    }

    if (method === "POST" && path === "/api/team/recommend") {
      const body = await readJsonBody(req);
      sendJson(res, 200, await recommendTeam(parseRecommendInput(body)));
      return;
    }

    if (method === "GET" && path === "/api/team/recommendations") {
      sendJson(res, 200, await listRecommendations(50));
      return;
    }

    if (method === "GET" && path === "/api/dashboard/summary") {
      sendJson(res, 200, await getDashboardSummary());
      return;
    }

    throw new ApiError(404, "ROUTE_NOT_FOUND", `No API route for ${method} ${path}`);
  } catch (error) {
    sendError(res, error, requestId);
  }
};

function getRequestId(req) {
  const existing = req.headers?.["x-vercel-id"] || req.headers?.["x-request-id"];
  if (Array.isArray(existing)) return existing[0];
  if (existing) return String(existing);
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function setBaseHeaders(res, requestId) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Request-Id");
  res.setHeader("X-Request-Id", requestId);
}

async function handleHealth(res) {
  if (!getConnectionString()) {
    sendJson(res, 503, {
      status: "error",
      database: "missing",
      error: "DATABASE_URL or POSTGRES_URL is not configured.",
    });
    return;
  }

  try {
    await ensureMigrationsApplied();
    await getPool().query("select 1");
    sendJson(res, 200, {
      status: "ok",
      database: "ready",
      migration: LATEST_MIGRATION_ID,
    });
  } catch (error) {
    sendJson(res, 503, {
      status: "error",
      database: "not_ready",
      error: error instanceof Error ? error.message : "Database is not ready.",
    });
  }
}

function getRequestPath(req) {
  const url = new URL(req.url || "/", "https://ai-team-optimizer.local");
  const pathname = url.pathname.replace(/\/+$/, "");
  return pathname || "/";
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function sendError(res, error, requestId) {
  const isApiError = error instanceof ApiError;
  const status = isApiError ? error.status : 500;
  const code = isApiError ? error.code : "INTERNAL_SERVER_ERROR";
  const message = isApiError ? error.message : "Internal server error.";
  const details = isApiError ? error.details : undefined;

  if (!isApiError) {
    console.error({ requestId, error }, "Unhandled API error");
  }

  sendJson(res, status, {
    error: message,
    code,
    requestId,
    ...(details === undefined ? {} : { details }),
  });
}

function getConnectionString() {
  for (const key of CONNECTION_ENV_KEYS) {
    if (process.env[key]) return process.env[key];
  }
  return undefined;
}

function getPool() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new ApiError(
      503,
      "DATABASE_NOT_CONFIGURED",
      "DATABASE_URL or POSTGRES_URL is not configured.",
    );
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 3,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}

function shouldUseSsl(connectionString) {
  try {
    const hostname = new URL(connectionString).hostname;
    return hostname !== "localhost" && hostname !== "127.0.0.1";
  } catch {
    return true;
  }
}

async function ensureMigrationsApplied() {
  if (!LATEST_MIGRATION_ID) {
    throw new ApiError(500, "MIGRATIONS_NOT_DEFINED", "No database migrations are defined.");
  }

  if (!migrationsReadyPromise) {
    migrationsReadyPromise = verifyLatestMigration().catch((error) => {
      migrationsReadyPromise = undefined;
      throw error;
    });
  }

  return migrationsReadyPromise;
}

async function verifyLatestMigration() {
  try {
    const result = await getPool().query(
      "select id from schema_migrations where id = $1",
      [LATEST_MIGRATION_ID],
    );

    if (!result.rowCount) {
      throw new ApiError(
        503,
        "DATABASE_MIGRATIONS_PENDING",
        `Database migration ${LATEST_MIGRATION_ID} has not been applied. Run pnpm run db:migrate before deploying.`,
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error && (error.code === "42P01" || error.code === "3F000")) {
      throw new ApiError(
        503,
        "DATABASE_MIGRATIONS_PENDING",
        "Database migrations have not been applied. Run pnpm run db:migrate before deploying.",
      );
    }

    throw error;
  }
}
async function listEmployees() {
  const result = await getPool().query(`
    select id, name, role, load, skill, created_at
    from employees
    order by lower(name), id
  `);
  return result.rows.map(mapEmployee);
}

async function getEmployee(id) {
  const result = await getPool().query(
    `select id, name, role, load, skill, created_at from employees where id = $1`,
    [id],
  );
  if (!result.rowCount) throw new ApiError(404, "EMPLOYEE_NOT_FOUND", `Employee ${id} was not found.`);
  return mapEmployee(result.rows[0]);
}

async function createEmployee(input) {
  const result = await getPool().query(
    `
      insert into employees (name, role, load, skill)
      values ($1, $2, $3, $4)
      returning id, name, role, load, skill, created_at
    `,
    [input.name, input.role, input.load, input.skill],
  );
  return mapEmployee(result.rows[0]);
}

async function updateEmployee(id, input) {
  const fields = [];
  const values = [];

  for (const key of ["name", "role", "load", "skill"]) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      values.push(input[key]);
      fields.push(`${key} = $${values.length}`);
    }
  }

  values.push(id);
  const result = await getPool().query(
    `
      update employees
      set ${fields.join(", ")}
      where id = $${values.length}
      returning id, name, role, load, skill, created_at
    `,
    values,
  );

  if (!result.rowCount) throw new ApiError(404, "EMPLOYEE_NOT_FOUND", `Employee ${id} was not found.`);
  return mapEmployee(result.rows[0]);
}

async function deleteEmployee(id) {
  const result = await getPool().query(`delete from employees where id = $1`, [id]);
  if (!result.rowCount) throw new ApiError(404, "EMPLOYEE_NOT_FOUND", `Employee ${id} was not found.`);
}

async function recommendTeam(input) {
  const employees = await listEmployees();
  const team = rankEmployees(employees, input.requiredRole).slice(0, input.teamSize);
  const { explanation, aiPowered } = await explainTeam(input, team);

  if (team.length > 0) {
    await createRecommendation({
      projectName: input.projectName,
      projectDescription: input.projectDescription,
      requiredRole: input.requiredRole,
      teamSize: input.teamSize,
      memberNames: team.map(({ employee }) => employee.name),
      explanation,
      aiPowered,
    });
  }

  return {
    projectName: input.projectName,
    team,
    explanation,
    aiPowered,
  };
}

async function createRecommendation(input) {
  const result = await getPool().query(
    `
      insert into recommendations (
        project_name,
        project_description,
        required_role,
        team_size,
        member_names,
        explanation,
        ai_powered
      )
      values ($1, $2, $3, $4, $5::jsonb, $6, $7)
      returning id, project_name, team_size, member_names, explanation, ai_powered, created_at
    `,
    [
      input.projectName,
      input.projectDescription ?? null,
      input.requiredRole ?? null,
      input.teamSize,
      JSON.stringify(input.memberNames),
      input.explanation,
      input.aiPowered,
    ],
  );
  return mapRecommendation(result.rows[0]);
}

async function listRecommendations(limit) {
  const result = await getPool().query(
    `
      select id, project_name, team_size, member_names, explanation, ai_powered, created_at
      from recommendations
      order by created_at desc, id desc
      limit $1
    `,
    [limit],
  );
  return result.rows.map(mapRecommendation);
}

async function getDashboardSummary() {
  const employees = await listEmployees();
  const recentRecommendations = await listRecommendations(5);
  const totalEmployees = employees.length;
  const averageLoad = totalEmployees
    ? employees.reduce((sum, employee) => sum + employee.load, 0) / totalEmployees
    : 0;
  const averageSkill = totalEmployees
    ? employees.reduce((sum, employee) => sum + employee.skill, 0) / totalEmployees
    : 0;
  const availableCapacity = employees.reduce(
    (sum, employee) => sum + (100 - employee.load),
    0,
  );
  const byRole = new Map();

  for (const employee of employees) {
    const current = byRole.get(employee.role) || { count: 0, loadSum: 0, skillSum: 0 };
    current.count += 1;
    current.loadSum += employee.load;
    current.skillSum += employee.skill;
    byRole.set(employee.role, current);
  }

  return {
    totalEmployees,
    averageLoad: Number(averageLoad.toFixed(1)),
    averageSkill: Number(averageSkill.toFixed(2)),
    availableCapacity,
    overloadedCount: employees.filter((employee) => employee.load >= 80).length,
    roleBreakdown: Array.from(byRole.entries())
      .map(([role, value]) => ({
        role,
        count: value.count,
        avgLoad: Number((value.loadSum / value.count).toFixed(1)),
        avgSkill: Number((value.skillSum / value.count).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count),
    topPerformers: [...employees]
      .sort((a, b) => scoreEmployee(b) - scoreEmployee(a))
      .slice(0, 5)
      .map((employee) => ({
        id: employee.id,
        name: employee.name,
        role: employee.role,
        skill: employee.skill,
        load: employee.load,
      })),
    recentRecommendations,
  };
}

function rankEmployees(employees, requiredRole) {
  const filtered = requiredRole
    ? employees.filter(
        (employee) => employee.role.toLowerCase() === requiredRole.toLowerCase(),
      )
    : employees;

  return filtered
    .map((employee) => ({
      employee,
      score: Number(scoreEmployee(employee).toFixed(2)),
      availability: 100 - employee.load,
    }))
    .sort((a, b) => b.score - a.score);
}

function scoreEmployee(employee) {
  return employee.skill * 2 - employee.load / 50;
}
async function explainTeam(input, team) {
  const fallback = buildLocalExplanation(team);

  if (team.length === 0) {
    return { explanation: fallback, aiPowered: false };
  }

  if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    return { explanation: fallback, aiPowered: false };
  }

  try {
    const aiText = await requestAiExplanation(input, team);
    if (aiText) return { explanation: aiText, aiPowered: true };
  } catch (error) {
    console.warn({ error }, "AI explanation failed; using deterministic fallback");
  }

  return { explanation: fallback, aiPowered: false };
}

async function requestAiExplanation(input, team) {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL.replace(/\/+$/, "");
  const model = process.env.OPENAI_TEAM_MODEL || "gpt-5.4";
  const timeoutMs = parsePositiveInteger(process.env.AI_EXPLANATION_TIMEOUT_MS, 8000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        max_completion_tokens: 1200,
        messages: [{ role: "user", content: buildAiPrompt(input, team) }],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI provider returned ${response.status}`);
    }

    const payload = await response.json();
    return payload?.choices?.[0]?.message?.content?.trim() || "";
  } finally {
    clearTimeout(timeout);
  }
}

function buildAiPrompt(input, team) {
  const memberSummary = team
    .map(({ employee, score, availability }) => {
      return `- ${employee.name}: роль ${employee.role}, навык ${employee.skill}/5, загрузка ${employee.load}%, свободно ${availability}%, score ${score.toFixed(2)}`;
    })
    .join("\n");

  return [
    "Ты опытный планировщик проектных ресурсов.",
    "Ответь на русском языке в 3-5 коротких предложениях.",
    "Объясни, почему эта команда подходит для проекта. Упоминай роль, навык и доступность участников. Избегай общих фраз.",
    "",
    `Проект: ${input.projectName}`,
    input.projectDescription ? `Описание: ${input.projectDescription}` : "",
    input.requiredRole ? `Фокус по роли: ${input.requiredRole}` : "",
    `Размер команды: ${input.teamSize}`,
    "",
    "Выбранная команда:",
    memberSummary,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildLocalExplanation(team) {
  if (team.length === 0) {
    return [
      "Не найдено сотрудников, подходящих под выбранные фильтры.",
      "Попробуйте расширить роль или добавить больше людей в реестр.",
    ].join("\n");
  }

  const lines = team.map(({ employee, score, availability }) => {
    return `${employee.name} (${employee.role}) имеет score ${score.toFixed(2)}, навык ${employee.skill}/5 и ${availability}% свободной мощности.`;
  });

  return [
    "Рекомендация рассчитана по уровню навыка и текущей загрузке:",
    ...lines,
  ].join("\n");
}

async function readJsonBody(req) {
  try {
    if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
      return req.body;
    }

    if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
      const text = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;
      if (Buffer.byteLength(text, "utf8") > MAX_JSON_BODY_BYTES) {
        throw new ApiError(413, "REQUEST_BODY_TOO_LARGE", "JSON body is too large.");
      }
      return text ? JSON.parse(text) : {};
    }

    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_JSON_BODY_BYTES) {
        throw new ApiError(413, "REQUEST_BODY_TOO_LARGE", "JSON body is too large.");
      }
      chunks.push(buffer);
    }

    const text = Buffer.concat(chunks).toString("utf8");
    return text ? JSON.parse(text) : {};
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof SyntaxError) {
      throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
    }
    throw error;
  }
}
function parseEmployeeInput(body, partial) {
  const record = assertRecord(body);
  const allowed = ["name", "role", "load", "skill"];
  assertAllowedFields(record, allowed);

  if (partial && !allowed.some((field) => Object.prototype.hasOwnProperty.call(record, field))) {
    throw new ApiError(400, "VALIDATION_ERROR", "At least one employee field must be provided.");
  }

  const input = {};

  if (!partial || Object.prototype.hasOwnProperty.call(record, "name")) {
    input.name = parseString(record.name, "name", { min: 1, max: 120 });
  }
  if (!partial || Object.prototype.hasOwnProperty.call(record, "role")) {
    input.role = parseString(record.role, "role", { min: 1, max: 80 });
  }
  if (!partial || Object.prototype.hasOwnProperty.call(record, "load")) {
    input.load = parseInteger(record.load, "load", 0, 100);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(record, "skill")) {
    input.skill = parseInteger(record.skill, "skill", 1, 5);
  }

  return input;
}

function parseRecommendInput(body) {
  const record = assertRecord(body);
  assertAllowedFields(record, ["projectName", "projectDescription", "requiredRole", "teamSize"]);

  const requiredRole =
    record.requiredRole === undefined || record.requiredRole === ""
      ? undefined
      : parseString(record.requiredRole, "requiredRole", { min: 1, max: 80 });

  return {
    projectName: parseString(record.projectName, "projectName", { min: 1, max: 160 }),
    projectDescription:
      record.projectDescription === undefined || record.projectDescription === ""
        ? undefined
        : parseString(record.projectDescription, "projectDescription", { min: 1, max: 2000 }),
    requiredRole,
    teamSize: parseInteger(record.teamSize, "teamSize", 1, 20),
  };
}

function assertRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", "JSON body must be an object.");
  }
  return value;
}

function assertAllowedFields(record, allowed) {
  const unknown = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unknown.length) {
    throw new ApiError(400, "VALIDATION_ERROR", "Request body contains unknown fields.", {
      fields: unknown,
    });
  }
}

function parseString(value, field, { min, max }) {
  if (typeof value !== "string") {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must be a string.`);
  }

  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must be ${min}-${max} characters long.`);
  }

  return trimmed;
}

function parseInteger(value, field, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must be an integer from ${min} to ${max}.`);
  }
  return value;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new ApiError(400, "INVALID_ID", "Invalid id.");
  return id;
}

function mapEmployee(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    load: row.load,
    skill: row.skill,
    createdAt: toIso(row.created_at),
  };
}

function mapRecommendation(row) {
  return {
    id: row.id,
    projectName: row.project_name,
    teamSize: row.team_size,
    memberNames: Array.isArray(row.member_names) ? row.member_names : [],
    explanation: row.explanation,
    aiPowered: row.ai_powered,
    createdAt: toIso(row.created_at),
  };
}

function toIso(value) {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}