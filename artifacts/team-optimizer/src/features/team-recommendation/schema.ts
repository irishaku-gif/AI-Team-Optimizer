import * as z from "zod";

export const ANY_ROLE = "any";

export const recommendSchema = z.object({
  projectName: z
    .string()
    .min(2, "Название проекта должно содержать минимум 2 символа"),
  projectDescription: z.string().optional(),
  requiredRole: z.string().optional(),
  teamSize: z
    .number()
    .min(1, "Размер команды должен быть от 1 до 20")
    .max(20, "Размер команды должен быть от 1 до 20"),
});

export type RecommendFormValues = z.infer<typeof recommendSchema>;
