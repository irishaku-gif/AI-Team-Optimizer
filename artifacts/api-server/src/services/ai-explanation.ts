import type { Logger } from "pino";
import type { RecommendTeamInput, ScoredEmployee } from "../domain/types";
import { localExplanation } from "../lib/scoring";

export interface TeamExplanation {
  explanation: string;
  aiPowered: boolean;
}

export interface AiExplanationService {
  explainTeam(
    body: RecommendTeamInput,
    team: ScoredEmployee[],
  ): Promise<TeamExplanation>;
}

function buildPrompt(body: RecommendTeamInput, team: ScoredEmployee[]): string {
  const memberSummary = team
    .map(
      ({ employee, score, availability }) =>
        `- ${employee.name} (${employee.role}, навык ${employee.skill}/5, текущая загрузка ${employee.load}%, свободно ${availability}%, балл соответствия ${score.toFixed(2)})`,
    )
    .join("\n");

  return `Ты опытный планировщик ресурсов. Ответь на русском языке. Объясни, почему эта команда подходит для проекта, в 3-5 коротких предложениях. Пиши конкретно: упоминай роль, навык и доступность каждого участника. Избегай неопределённых формулировок.

Проект: ${body.projectName}
${body.projectDescription ? `Описание: ${body.projectDescription}` : ""}
${body.requiredRole ? `Фокус по роли: ${body.requiredRole}` : ""}
Запрошенный размер команды: ${body.teamSize}

Выбранная команда:
${memberSummary}`;
}

export function createAiExplanationService(logger: Logger): AiExplanationService {
  return {
    async explainTeam(body, team) {
      const fallback = localExplanation(team);

      if (team.length === 0) {
        return { explanation: fallback, aiPowered: false };
      }

      if (
        !process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ||
        !process.env.AI_INTEGRATIONS_OPENAI_API_KEY
      ) {
        return { explanation: fallback, aiPowered: false };
      }

      try {
        const integrationPackage = "@workspace/integrations-openai-ai-server";
        const { openai } = await import(integrationPackage);
        const response = await openai.chat.completions.create({
          model: process.env.OPENAI_TEAM_MODEL ?? "gpt-5.4",
          max_completion_tokens: 8192,
          messages: [{ role: "user", content: buildPrompt(body, team) }],
        });
        const aiText = response.choices[0]?.message?.content?.trim();

        if (aiText) {
          return { explanation: aiText, aiPowered: true };
        }
      } catch (err) {
        logger.warn({ err }, "AI explanation failed, using local fallback");
      }

      return { explanation: fallback, aiPowered: false };
    },
  };
}
