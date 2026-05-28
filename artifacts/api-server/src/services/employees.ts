import type {
  CreateEmployeeInput,
  Employee,
  UpdateEmployeeInput,
} from "../domain/types";
import { BadRequestError, NotFoundError } from "../lib/errors";
import type { EmployeeRepository } from "../repositories/types";

export interface EmployeesService {
  list(): Promise<Employee[]>;
  create(input: CreateEmployeeInput): Promise<Employee>;
  getById(id: number): Promise<Employee>;
  update(id: number, input: UpdateEmployeeInput): Promise<Employee>;
  delete(id: number): Promise<void>;
}

export function createEmployeesService(
  employees: EmployeeRepository,
): EmployeesService {
  return {
    list() {
      return employees.list();
    },

    create(input) {
      return employees.create(input);
    },

    async getById(id) {
      const employee = await employees.getById(id);
      if (!employee) {
        throw new NotFoundError("Employee not found");
      }
      return employee;
    },

    async update(id, input) {
      if (Object.keys(input).length === 0) {
        throw new BadRequestError("No fields to update");
      }

      const employee = await employees.update(id, input);
      if (!employee) {
        throw new NotFoundError("Employee not found");
      }
      return employee;
    },

    async delete(id) {
      const deleted = await employees.delete(id);
      if (!deleted) {
        throw new NotFoundError("Employee not found");
      }
    },
  };
}
