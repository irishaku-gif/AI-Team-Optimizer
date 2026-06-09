const { Pool } = require("pg");

const CONNECTION_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_PRISMA_URL",
];

let pool;
let schemaReadyPromise;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = async function handler(req, res) {
  setResponseHeaders(res);

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

    await ensureSchema();

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

    throw new HttpError(404, `No API route for ${method} ${path}`);
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected API error";
    sendJson(res, status, { error: message });
  }
};

function setResponseHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function handleHealth(res) {
  const connectionString = getConnectionString();
  if (!connectionString) {
    sendJson(res, 200, { status: "ok", database: "missing" });
    return;
  }

  await ensureSchema();
  await getPool().query("select 1");
  sendJson(res, 200, { status: "ok", database: "ready" });
}

function getRequestPath(req) {
  const url = new URL(req.url || "/", "https://ai-team-optimizer.local");
  const pathname = url.pathname.replace(/\/+$/, "");
  return pathname || "/";
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.end(JSON.stringify(data));
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
    throw new HttpError(
      500,
      "DATABASE_URL or POSTGRES_URL is not configured in Vercel.",
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

async function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = createSchema().catch((error) => {
      schemaReadyPromise = undefined;
      throw error;
    });
  }
  return schemaReadyPromise;
}

async function createSchema() {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    await client.query(`
      create table if not exists employees (
        id serial primary key,
        name text not null,
        role text not null,
        load integer not null check (load >= 0 and load <= 100),
        skill integer not null check (skill >= 1 and skill <= 5),
        created_at timestamp with time zone not null default now()
      )
    `);
    await client.query(`
      create table if not exists recommendations (
        id serial primary key,
        project_name text not null,
        team_size integer not null check (team_size >= 1 and team_size <= 20),
        member_names jsonb not null,
        explanation text not null,
        ai_powered boolean not null,
        created_at timestamp with time zone not null default now()
      )
    `);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
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
  if (!result.rowCount) throw new HttpError(404, `Employee ${id} was not found.`);
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

  if (fields.length === 0) return getEmployee(id);

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

  if (!result.rowCount) throw new HttpError(404, `Employee ${id} was not found.`);
  return mapEmployee(result.rows[0]);
}

async function deleteEmployee(id) {
  const result = await getPool().query(`delete from employees where id = $1`, [id]);
  if (!result.rowCount) throw new HttpError(404, `Employee ${id} was not found.`);
}

async function recommendTeam(input) {
  const employees = await listEmployees();
  const team = rankEmployees(employees, input.requiredRole).slice(0, input.teamSize);
  const explanation = buildExplanation(team);

  if (team.length > 0) {
    await createRecommendation({
      projectName: input.projectName,
      teamSize: input.teamSize,
      memberNames: team.map(({ employee }) => employee.name),
      explanation,
      aiPowered: false,
    });
  }

  return {
    projectName: input.projectName,
    team,
    explanation,
    aiPowered: false,
  };
}

async function createRecommendation(input) {
  const result = await getPool().query(
    `
      insert into recommendations (project_name, team_size, member_names, explanation, ai_powered)
      values ($1, $2, $3::jsonb, $4, $5)
      returning id, project_name, team_size, member_names, explanation, ai_powered, created_at
    `,
    [
      input.projectName,
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

function buildExplanation(team) {
  if (team.length === 0) {
    return [
      "No matching employees were found for the selected filters.",
      "Try a broader role filter or add more people to the roster.",
    ].join("\n");
  }

  const lines = team.map(({ employee, score, availability }) => {
    return `${employee.name} (${employee.role}) has score ${score.toFixed(2)}, skill ${employee.skill}/5, and ${availability}% available capacity.`;
  });

  return [
    "Production recommendation based on skill level and current workload:",
    ...lines,
  ].join("\n");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
    const text = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;
    return text ? JSON.parse(text) : {};
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function parseEmployeeInput(body, partial) {
  const record = assertRecord(body);
  const input = {};

  if (!partial || Object.prototype.hasOwnProperty.call(record, "name")) {
    input.name = parseNonEmptyString(record.name, "name");
  }
  if (!partial || Object.prototype.hasOwnProperty.call(record, "role")) {
    input.role = parseNonEmptyString(record.role, "role");
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
  const requiredRole =
    record.requiredRole === undefined || record.requiredRole === ""
      ? undefined
      : parseNonEmptyString(record.requiredRole, "requiredRole");

  return {
    projectName: parseNonEmptyString(record.projectName, "projectName"),
    projectDescription:
      record.projectDescription === undefined
        ? undefined
        : String(record.projectDescription),
    requiredRole,
    teamSize: parseInteger(record.teamSize, "teamSize", 1, 20),
  };
}

function assertRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "JSON body must be an object.");
  }
  return value;
}

function parseNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${field} must be a non-empty string.`);
  }
  return value.trim();
}

function parseInteger(value, field, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new HttpError(400, `${field} must be an integer from ${min} to ${max}.`);
  }
  return value;
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "Invalid id.");
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
