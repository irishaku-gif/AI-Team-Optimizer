import type { RecommendTeamInput, ScoredEmployee } from "../domain/types";
import { rankEmployees } from "../lib/scoring";
import type {
  EmployeeRepository,
  RecommendationRepository,
} from "../repositories/types";
import type { AiExplanationService } from "./ai-explanation";

export interface TeamRecommendationResult {
  projectName: string;
  team: ScoredEmployee[];
  explanation: string;
  aiPowered: boolean;
}

export interface TeamService {
  recommend(body: RecommendTeamInput): Promise<TeamRecommendationResult>;
  listRecommendations(): ReturnType<RecommendationRepository["listRecent"]>;
}

export function createTeamService(
  employees: EmployeeRepository,
  recommendations: RecommendationRepository,
  aiExplanation: AiExplanationService,
): TeamService {
  return {
    async recommend(body) {
      const allEmployees = await employees.list();
      const team = rankEmployees(allEmployees, {
        requiredRole: body.requiredRole,
        teamSize: body.teamSize,
      });
      const { explanation, aiPowered } = await aiExplanation.explainTeam(
        body,
        team,
      );

      if (team.length > 0) {
        await recommendations.create({
          projectName: body.projectName,
          teamSize: body.teamSize,
          memberNames: team.map((member) => member.employee.name),
          explanation,
          aiPowered,
        });
      }

      return {
        projectName: body.projectName,
        team,
        explanation,
        aiPowered,
      };
    },

    listRecommendations() {
      return recommendations.listRecent(50);
    },
  };
}
