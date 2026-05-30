import type {
  CreateEmployeeBody,
  DashboardSummary,
  Employee,
  RecommendTeamBody,
  SavedRecommendation,
  ScoredEmployee,
  TeamRecommendation,
  UpdateEmployeeBody,
} from "@workspace/api-client-react";

const STORAGE_KEY = "team-optimizer-static-demo-v1";

type DemoState = {
  nextEmployeeId: number;
  nextRecommendationId: number;
  employees: Employee[];
  recommendations: SavedRecommendation[];
};

const initialEmployees: Employee[] = [
  {
    id: 1,
    name: "Anna Petrova",
    role: "Frontend",
    load: 45,
    skill: 5,
    createdAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: 2,
    name: "Mikhail Sokolov",
    role: "Backend",
    load: 62,
    skill: 5,
    createdAt: "2026-01-12T09:00:00.000Z",
  },
  {
    id: 3,
    name: "Elena Morozova",
    role: "Data",
    load: 35,
    skill: 4,
    createdAt: "2026-01-14T09:00:00.000Z",
  },
  {
    id: 4,
    name: "Pavel Orlov",
    role: "SAP",
    load: 80,
    skill: 4,
    createdAt: "2026-01-16T09:00:00.000Z",
  },
  {
    id: 5,
    name: "Sofia Kuznetsova",
    role: "QA",
    load: 28,
    skill: 4,
    createdAt: "2026-01-18T09:00:00.000Z",
  },
  {
    id: 6,
    name: "Dmitry Volkov",
    role: "Design",
    load: 55,
    skill: 3,
    createdAt: "2026-01-20T09:00:00.000Z",
  },
];

let installed = false;
let state: DemoState = loadState();

export function installStaticDemoApi(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const realFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url, window.location.href);

    if (!url.pathname.startsWith("/api/")) {
      return realFetch(input, init);
    }

    try {
      return await handleApiRequest(request, url);
    } catch (error) {
      return jsonResponse(
        {
          error:
            error instanceof Error ? error.message : "Unexpected static demo error",
        },
        500,
      );
    }
  };
}

async function handleApiRequest(request: Request, url: URL): Promise<Response> {
  const method = request.method.toUpperCase();
  const path = url.pathname.replace(/\/+$/, "");

  if (method === "GET" && path === "/api/healthz") {
    return jsonResponse({ status: "ok" });
  }

  if (method === "GET" && path === "/api/employees") {
    return jsonResponse(listEmployees());
  }

  if (method === "POST" && path === "/api/employees") {
    const body = (await readJson(request)) as CreateEmployeeBody;
    const employee = createEmployee(body);
    return jsonResponse(employee, 201);
  }

  const employeeMatch = path.match(/^\/api\/employees\/(\d+)$/);
  if (employeeMatch) {
    const id = Number(employeeMatch[1]);

    if (method === "GET") {
      return jsonResponse(findEmployee(id));
    }

    if (method === "PATCH") {
      const body = (await readJson(request)) as UpdateEmployeeBody;
      return jsonResponse(updateEmployee(id, body));
    }

    if (method === "DELETE") {
      deleteEmployee(id);
      return new Response(null, { status: 204 });
    }
  }

  if (method === "POST" && path === "/api/team/recommend") {
    const body = (await readJson(request)) as RecommendTeamBody;
    return jsonResponse(recommendTeam(body));
  }

  if (method === "GET" && path === "/api/team/recommendations") {
    return jsonResponse(
      [...state.recommendations].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  }

  if (method === "GET" && path === "/api/dashboard/summary") {
    return jsonResponse(getDashboardSummary());
  }

  return jsonResponse({ error: `No static demo route for ${method} ${path}` }, 404);
}

function loadState(): DemoState {
  if (typeof localStorage === "undefined") {
    return createInitialState();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialState();

  try {
    const parsed = JSON.parse(raw) as DemoState;
    if (!Array.isArray(parsed.employees)) return createInitialState();
    if (!Array.isArray(parsed.recommendations)) return createInitialState();
    return parsed;
  } catch {
    return createInitialState();
  }
}

function createInitialState(): DemoState {
  return {
    nextEmployeeId: 7,
    nextRecommendationId: 1,
    employees: [...initialEmployees],
    recommendations: [],
  };
}

function saveState(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function listEmployees(): Employee[] {
  return [...state.employees].sort((a, b) => a.name.localeCompare(b.name));
}

function findEmployee(id: number): Employee {
  const employee = state.employees.find((candidate) => candidate.id === id);
  if (!employee) throw new Error(`Employee ${id} was not found.`);
  return employee;
}

function createEmployee(input: CreateEmployeeBody): Employee {
  const employee: Employee = {
    id: state.nextEmployeeId++,
    createdAt: new Date().toISOString(),
    ...input,
  };
  state.employees.push(employee);
  saveState();
  return employee;
}

function updateEmployee(id: number, input: UpdateEmployeeBody): Employee {
  const employee = findEmployee(id);
  Object.assign(employee, input);
  saveState();
  return employee;
}

function deleteEmployee(id: number): void {
  state.employees = state.employees.filter((employee) => employee.id !== id);
  saveState();
}

function recommendTeam(input: RecommendTeamBody): TeamRecommendation {
  const ranked = rankEmployees(input.requiredRole).slice(0, input.teamSize);
  const explanation = buildExplanation(ranked);

  const recommendation: SavedRecommendation = {
    id: state.nextRecommendationId++,
    projectName: input.projectName,
    teamSize: input.teamSize,
    memberNames: ranked.map(({ employee }) => employee.name),
    explanation,
    aiPowered: false,
    createdAt: new Date().toISOString(),
  };

  if (ranked.length > 0) {
    state.recommendations.unshift(recommendation);
    saveState();
  }

  return {
    projectName: input.projectName,
    team: ranked,
    explanation,
    aiPowered: false,
  };
}

function rankEmployees(requiredRole?: string): ScoredEmployee[] {
  const pool = requiredRole
    ? state.employees.filter(
        (employee) => employee.role.toLowerCase() === requiredRole.toLowerCase(),
      )
    : state.employees;

  return [...pool]
    .map((employee) => ({
      employee,
      score: Number(scoreEmployee(employee).toFixed(2)),
      availability: 100 - employee.load,
    }))
    .sort((a, b) => b.score - a.score);
}

function scoreEmployee(employee: Employee): number {
  return employee.skill * 2 - employee.load / 50;
}

function buildExplanation(team: ScoredEmployee[]): string {
  if (team.length === 0) {
    return [
      "No matching employees were found for the selected filters.",
      "Try a broader role filter or add more people to the roster.",
    ].join("\n");
  }

  const lines = team.map(({ employee, score, availability }) => {
    return `${employee.name} (${employee.role}) has score ${score.toFixed(
      2,
    )}, skill ${employee.skill}/5, and ${availability}% available capacity.`;
  });

  return [
    "Static demo recommendation based on skill level and current workload:",
    ...lines,
  ].join("\n");
}

function getDashboardSummary(): DashboardSummary {
  const employees = listEmployees();
  const totalEmployees = employees.length;
  const averageLoad =
    totalEmployees === 0
      ? 0
      : employees.reduce((sum, employee) => sum + employee.load, 0) /
        totalEmployees;
  const averageSkill =
    totalEmployees === 0
      ? 0
      : employees.reduce((sum, employee) => sum + employee.skill, 0) /
        totalEmployees;
  const availableCapacity = employees.reduce(
    (sum, employee) => sum + (100 - employee.load),
    0,
  );

  const byRole = new Map<
    string,
    { count: number; loadSum: number; skillSum: number }
  >();

  for (const employee of employees) {
    const current = byRole.get(employee.role) ?? {
      count: 0,
      loadSum: 0,
      skillSum: 0,
    };
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
    recentRecommendations: state.recommendations.slice(0, 5),
  };
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  return text ? JSON.parse(text) : {};
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}
