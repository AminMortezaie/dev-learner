import { Router, type IRouter } from "express";
import { db, languagesTable, topicsTable, resourcesTable, syntaxLessonsTable, quizzesTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/languages", async (req, res): Promise<void> => {
  const langs = await db.select().from(languagesTable).orderBy(languagesTable.id);

  const withCounts = await Promise.all(
    langs.map(async (lang) => {
      const [topicCount] = await db.select({ count: count() }).from(topicsTable).where(eq(topicsTable.languageId, lang.id));
      const [resourceCount] = await db.select({ count: count() }).from(resourcesTable).where(eq(resourcesTable.languageId, lang.id));
      const [lessonCount] = await db.select({ count: count() }).from(syntaxLessonsTable).where(eq(syntaxLessonsTable.languageId, lang.id));
      return {
        ...lang,
        topicCount: topicCount?.count ?? 0,
        resourceCount: resourceCount?.count ?? 0,
        lessonCount: lessonCount?.count ?? 0,
      };
    })
  );

  res.json(withCounts);
});

export default router;
