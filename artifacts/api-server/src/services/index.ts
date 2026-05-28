import type { Logger } from "pino";
import type { AppRepositories } from "../repositories/types";
import { createAiExplanationService } from "./ai-explanation";
import { createDashboardService, type DashboardService } from "./dashboard";
import { createEmployeesService, type EmployeesService } from "./employees";
import { createTeamService, type TeamService } from "./team";

export interface AppServices {
  employees: EmployeesService;
  team: TeamService;
  dashboard: DashboardService;
}

export function createServices(
  repositories: AppRepositories,
  logger: Logger,
): AppServices {
  const aiExplanation = createAiExplanationService(logger);

  return {
    employees: createEmployeesService(repositories.employees),
    team: createTeamService(
      repositories.employees,
      repositories.recommendations,
      aiExplanation,
    ),
    dashboard: createDashboardService(
      repositories.employees,
      repositories.recommendations,
    ),
  };
}
