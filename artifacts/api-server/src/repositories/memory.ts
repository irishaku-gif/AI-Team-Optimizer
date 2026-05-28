import type {
  CreateEmployeeInput,
  CreateRecommendationInput,
  Employee,
  SavedRecommendation,
  UpdateEmployeeInput,
} from "../domain/types";
import type { AppRepositories } from "./types";

let nextEmployeeId = 7;
let nextRecommendationId = 1;

const employees: Employee[] = [
  {
    id: 1,
    name: "Анна Петрова",
    role: "Фронтенд",
    load: 45,
    skill: 5,
    createdAt: new Date("2026-01-10T09:00:00.000Z"),
  },
  {
    id: 2,
    name: "Михаил Соколов",
    role: "Бэкенд",
    load: 62,
    skill: 5,
    createdAt: new Date("2026-01-12T09:00:00.000Z"),
  },
  {
    id: 3,
    name: "Елена Морозова",
    role: "Данные",
    load: 35,
    skill: 4,
    createdAt: new Date("2026-01-14T09:00:00.000Z"),
  },
  {
    id: 4,
    name: "Павел Орлов",
    role: "SAP",
    load: 80,
    skill: 4,
    createdAt: new Date("2026-01-16T09:00:00.000Z"),
  },
  {
    id: 5,
    name: "София Кузнецова",
    role: "Тестирование",
    load: 28,
    skill: 4,
    createdAt: new Date("2026-01-18T09:00:00.000Z"),
  },
  {
    id: 6,
    name: "Дмитрий Волков",
    role: "Дизайн",
    load: 55,
    skill: 3,
    createdAt: new Date("2026-01-20T09:00:00.000Z"),
  },
];

const recommendations: SavedRecommendation[] = [];

export function createMemoryRepositories(): AppRepositories {
  return {
    employees: {
      async list() {
        return [...employees].sort((a, b) => a.name.localeCompare(b.name));
      },

      async create(input: CreateEmployeeInput) {
        const employee: Employee = {
          id: nextEmployeeId++,
          createdAt: new Date(),
          ...input,
        };
        employees.push(employee);
        return employee;
      },

      async getById(id: number) {
        return employees.find((employee) => employee.id === id);
      },

      async update(id: number, input: UpdateEmployeeInput) {
        const employee = employees.find((candidate) => candidate.id === id);
        if (!employee) return undefined;

        Object.assign(employee, input);
        return employee;
      },

      async delete(id: number) {
        const index = employees.findIndex((employee) => employee.id === id);
        if (index === -1) return undefined;

        const [deleted] = employees.splice(index, 1);
        return deleted;
      },
    },

    recommendations: {
      async listRecent(limit: number) {
        return [...recommendations]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit);
      },

      async create(input: CreateRecommendationInput) {
        const recommendation: SavedRecommendation = {
          id: nextRecommendationId++,
          createdAt: new Date(),
          ...input,
        };
        recommendations.unshift(recommendation);
        return recommendation;
      },
    },
  };
}
