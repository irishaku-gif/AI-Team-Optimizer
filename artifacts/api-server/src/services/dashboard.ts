import type { DashboardSummary } from "../domain/types";
import { scoreEmployee } from "../lib/scoring";
import type {
  EmployeeRepository,
  RecommendationRepository,
} from "../repositories/types";

export interface DashboardService {
  getSummary(): Promise<DashboardSummary>;
}

export function createDashboardService(
  employeesRepository: EmployeeRepository,
  recommendationsRepository: RecommendationRepository,
): DashboardService {
  return {
    async getSummary() {
      const employees = await employeesRepository.list();
      const recentRecommendations =
        await recommendationsRepository.listRecent(5);

      const totalEmployees = employees.length;
      const averageLoad = totalEmployees
        ? employees.reduce((sum, employee) => sum + employee.load, 0) /
          totalEmployees
        : 0;
      const averageSkill = totalEmployees
        ? employees.reduce((sum, employee) => sum + employee.skill, 0) /
          totalEmployees
        : 0;
      const availableCapacity = employees.reduce(
        (sum, employee) => sum + (100 - employee.load),
        0,
      );
      const overloadedCount = employees.filter(
        (employee) => employee.load >= 80,
      ).length;

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

      const roleBreakdown = Array.from(byRole.entries())
        .map(([role, value]) => ({
          role,
          count: value.count,
          avgLoad: Number((value.loadSum / value.count).toFixed(1)),
          avgSkill: Number((value.skillSum / value.count).toFixed(2)),
        }))
        .sort((a, b) => b.count - a.count);

      const topPerformers = [...employees]
        .sort((a, b) => scoreEmployee(b) - scoreEmployee(a))
        .slice(0, 5)
        .map((employee) => ({
          id: employee.id,
          name: employee.name,
          role: employee.role,
          skill: employee.skill,
          load: employee.load,
        }));

      return {
        totalEmployees,
        averageLoad: Number(averageLoad.toFixed(1)),
        averageSkill: Number(averageSkill.toFixed(2)),
        availableCapacity,
        overloadedCount,
        roleBreakdown,
        topPerformers,
        recentRecommendations,
      };
    },
  };
}
