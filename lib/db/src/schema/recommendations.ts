import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const recommendationsTable = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  projectName: text("project_name").notNull(),
  teamSize: integer("team_size").notNull(),
  memberNames: jsonb("member_names").$type<string[]>().notNull(),
  explanation: text("explanation").notNull(),
  aiPowered: boolean("ai_powered").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Recommendation = typeof recommendationsTable.$inferSelect;
