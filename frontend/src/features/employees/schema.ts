import * as z from "zod";

export const PRESET_ROLES = [
  "Фронтенд",
  "Бэкенд",
  "Фулстек",
  "Инфраструктура",
  "Дизайн",
  "Проджект-менеджмент",
  "Данные",
  "SAP",
  "Тестирование",
];

export const employeeSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  role: z.string().min(2, "Роль должна содержать минимум 2 символа"),
  load: z
    .number()
    .min(0, "Загрузка должна быть от 0 до 100")
    .max(100, "Загрузка должна быть от 0 до 100"),
  skill: z
    .number()
    .min(1, "Навык должен быть от 1 до 5")
    .max(5, "Навык должен быть от 1 до 5"),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
