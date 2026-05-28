import { Router, type IRouter } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import type { AppServices } from "../services";

export function createDashboardRouter(services: AppServices): IRouter {
  const router: IRouter = Router();

  router.get(
    "/dashboard/summary",
    asyncHandler(async (_req, res) => {
      res.json(await services.dashboard.getSummary());
    }),
  );

  return router;
}
