import type { Employee, ScoredEmployee } from "../domain/types";

export function scoreEmployee(emp: Employee): number {
  return emp.skill * 2 - emp.load / 50;
}

export function rankEmployees(
  employees: Employee[],
  options: { requiredRole?: string; teamSize: number },
): ScoredEmployee[] {
  const filtered = options.requiredRole
    ? employees.filter(
        (e) => e.role.toLowerCase() === options.requiredRole!.toLowerCase(),
      )
    : employees;

  const ranked = [...filtered]
    .map<ScoredEmployee>((employee) => ({
      employee,
      score: Number(scoreEmployee(employee).toFixed(2)),
      availability: 100 - employee.load,
    }))
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, options.teamSize);
}

export function localExplanation(team: ScoredEmployee[]): string {
  if (team.length === 0) {
    return "Нет сотрудников, подходящих под заданные условия. Попробуйте расширить фильтр по роли или добавить больше людей в список.";
  }
  const lines = team.map(({ employee, score, availability }) => {
    return `${employee.name} (${employee.role}) — балл ${score.toFixed(2)} с учётом навыка ${employee.skill}/5 и ${availability}% свободной ёмкости.`;
  });
  return [
    "Команда подобрана на основе рейтинга кандидатов по сочетанию навыка и текущей доступности:",
    ...lines,
  ].join("\n");
}
