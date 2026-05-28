import type {
  CreateEmployeeInput,
  CreateRecommendationInput,
  Employee,
  SavedRecommendation,
  UpdateEmployeeInput,
} from "../domain/types";

export interface EmployeeRepository {
  list(): Promise<Employee[]>;
  create(input: CreateEmployeeInput): Promise<Employee>;
  getById(id: number): Promise<Employee | undefined>;
  update(id: number, input: UpdateEmployeeInput): Promise<Employee | undefined>;
  delete(id: number): Promise<Employee | undefined>;
}

export interface RecommendationRepository {
  listRecent(limit: number): Promise<SavedRecommendation[]>;
  create(input: CreateRecommendationInput): Promise<SavedRecommendation>;
}

export interface AppRepositories {
  employees: EmployeeRepository;
  recommendations: RecommendationRepository;
}
