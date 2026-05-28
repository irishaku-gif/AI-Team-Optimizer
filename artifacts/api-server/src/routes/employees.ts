import { Router, type IRouter } from "express";
import {
  CreateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  UpdateEmployeeBody,
  DeleteEmployeeParams,
} from "@workspace/api-zod";
import { asyncHandler } from "../middlewares/async-handler";
import type { AppServices } from "../services";

export function createEmployeesRouter(services: AppServices): IRouter {
  const router: IRouter = Router();

  router.get(
    "/employees",
    asyncHandler(async (_req, res) => {
      res.json(await services.employees.list());
    }),
  );

  router.post(
    "/employees",
    asyncHandler(async (req, res) => {
      const body = CreateEmployeeBody.parse(req.body);
      const created = await services.employees.create(body);
      res.status(201).json(created);
    }),
  );

  router.get(
    "/employees/:id",
    asyncHandler(async (req, res) => {
      const { id } = GetEmployeeParams.parse(req.params);
      res.json(await services.employees.getById(id));
    }),
  );

  router.patch(
    "/employees/:id",
    asyncHandler(async (req, res) => {
      const { id } = UpdateEmployeeParams.parse(req.params);
      const body = UpdateEmployeeBody.parse(req.body);
      res.json(await services.employees.update(id, body));
    }),
  );

  router.delete(
    "/employees/:id",
    asyncHandler(async (req, res) => {
      const { id } = DeleteEmployeeParams.parse(req.params);
      await services.employees.delete(id);
      res.status(204).send();
    }),
  );

  return router;
}
