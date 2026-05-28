import { desc, eq } from "drizzle-orm";
import type {
  CreateEmployeeInput,
  CreateRecommendationInput,
  UpdateEmployeeInput,
} from "../domain/types";
import type { AppRepositories } from "./types";

async function getDb() {
  return import("@workspace/db");
}

export function createPostgresRepositories(): AppRepositories {
  return {
    employees: {
      async list() {
        const { db, employeesTable } = await getDb();
        return db.select().from(employeesTable).orderBy(employeesTable.name);
      },

      async create(input: CreateEmployeeInput) {
        const { db, employeesTable } = await getDb();
        const [created] = await db.insert(employeesTable).values(input).returning();
        return created;
      },

      async getById(id: number) {
        const { db, employeesTable } = await getDb();
        const [row] = await db
          .select()
          .from(employeesTable)
          .where(eq(employeesTable.id, id));
        return row;
      },

      async update(id: number, input: UpdateEmployeeInput) {
        const { db, employeesTable } = await getDb();
        const [updated] = await db
          .update(employeesTable)
          .set(input)
          .where(eq(employeesTable.id, id))
          .returning();
        return updated;
      },

      async delete(id: number) {
        const { db, employeesTable } = await getDb();
        const [deleted] = await db
          .delete(employeesTable)
          .where(eq(employeesTable.id, id))
          .returning();
        return deleted;
      },
    },

    recommendations: {
      async listRecent(limit: number) {
        const { db, recommendationsTable } = await getDb();
        return db
          .select()
          .from(recommendationsTable)
          .orderBy(desc(recommendationsTable.createdAt))
          .limit(limit);
      },

      async create(input: CreateRecommendationInput) {
        const { db, recommendationsTable } = await getDb();
        const [created] = await db
          .insert(recommendationsTable)
          .values(input)
          .returning();
        return created;
      },
    },
  };
}
