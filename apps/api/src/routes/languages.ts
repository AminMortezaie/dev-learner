import { Router } from "express";
import { sql, eq } from "drizzle-orm";
import {
  db,
  languagesTable,
  topicsTable,
  resourcesTable,
  syntaxLessonsTable,
} from "@devlearn/database";
import { asyncHandler } from "../lib/async.ts";

export const languagesRouter = Router();

languagesRouter.get(
  "/languages",
  asyncHandler(async (_req, res) => {
    const langs = await db.select().from(languagesTable).orderBy(languagesTable.id);

    // N+1 is fine for ~5 languages; switch to a single grouped query if this grows.
    const enriched = await Promise.all(
      langs.map(async (l) => {
        const [topics] = await db
          .select({ c: sql<number>`count(*)::int` })
          .from(topicsTable)
          .where(eq(topicsTable.languageId, l.id));
        const [resources] = await db
          .select({ c: sql<number>`count(*)::int` })
          .from(resourcesTable)
          .where(eq(resourcesTable.languageId, l.id));
        const [lessons] = await db
          .select({ c: sql<number>`count(*)::int` })
          .from(syntaxLessonsTable)
          .where(eq(syntaxLessonsTable.languageId, l.id));
        return {
          ...l,
          createdAt: l.createdAt ? l.createdAt.toISOString() : null,
          topicCount: topics?.c ?? 0,
          resourceCount: resources?.c ?? 0,
          lessonCount: lessons?.c ?? 0,
        };
      }),
    );

    res.json(enriched);
  }),
);
