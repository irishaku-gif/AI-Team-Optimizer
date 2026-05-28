import { Router, type IRouter } from "express";
import { RecommendTeamBody } from "@workspace/api-zod";
import { asyncHandler } from "../middlewares/async-handler";
import type { AppServices } from "../services";

export function createTeamRouter(services: AppServices): IRouter {
  const router: IRouter = Router();

  router.post(
    "/team/recommend",
    asyncHandler(async (req, res) => {
      const body = RecommendTeamBody.parse(req.body);
      res.json(await services.team.recommend(body));
    }),
  );

  router.get(
    "/team/recommendations",
    asyncHandler(async (_req, res) => {
      res.json(await services.team.listRecommendations());
    }),
  );

  return router;
}
