export interface Employee {
  id: number;
  name: string;
  role: string;
  load: number;
  skill: number;
  createdAt: Date;
}

export type CreateEmployeeInput = Omit<Employee, "id" | "createdAt">;
export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

export interface SavedRecommendation {
  id: number;
  projectName: string;
  teamSize: number;
  memberNames: string[];
  explanation: string;
  aiPowered: boolean;
  createdAt: Date;
}

export type CreateRecommendationInput = Omit<
  SavedRecommendation,
  "id" | "createdAt"
>;

export interface RecommendTeamInput {
  projectName: string;
  projectDescription?: string;
  requiredRole?: string;
  teamSize: number;
}

export interface ScoredEmployee {
  employee: Employee;
  score: number;
  availability: number;
}

export interface RoleBreakdown {
  role: string;
  count: number;
  avgLoad: number;
  avgSkill: number;
}

export interface TopPerformer {
  id: number;
  name: string;
  role: string;
  skill: number;
  load: number;
}

export interface DashboardSummary {
  totalEmployees: number;
  averageLoad: number;
  averageSkill: number;
  availableCapacity: number;
  overloadedCount: number;
  roleBreakdown: RoleBreakdown[];
  topPerformers: TopPerformer[];
  recentRecommendations: SavedRecommendation[];
}
