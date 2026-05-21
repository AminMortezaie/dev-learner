import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { languagesTable } from "./languages";

export const syntaxLessonsTable = pgTable("syntax_lessons", {
  id: serial("id").primaryKey(),
  languageId: integer("language_id").notNull().references(() => languagesTable.id),
  title: text("title").notNull(),
  concept: text("concept").notNull(),
  rawSyntax: text("raw_syntax"),
  explanation: text("explanation"),
  realWorldExample: text("real_world_example"),
  githubProject: text("github_project"),
  githubUrl: text("github_url"),
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  category: text("category"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSyntaxLessonSchema = createInsertSchema(syntaxLessonsTable).omit({ id: true, createdAt: true });
export type InsertSyntaxLesson = z.infer<typeof insertSyntaxLessonSchema>;
export type SyntaxLesson = typeof syntaxLessonsTable.$inferSelect;
