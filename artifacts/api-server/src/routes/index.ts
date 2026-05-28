import { Router, type IRouter } from "express";
import { createHealthRouter } from "./health";
import { createEmployeesRouter } from "./employees";
import { createTeamRouter } from "./team";
import { createDashboardRouter } from "./dashboard";
import type { AppServices } from "../services";

export function createApiRouter(services: AppServices): IRouter {
  const router: IRouter = Router();

  router.use(createHealthRouter());
  router.use(createEmployeesRouter(services));
  router.use(createTeamRouter(services));
  router.use(createDashboardRouter(services));

  return router;
}
