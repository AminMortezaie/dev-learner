import { Router, type IRouter } from "express";
import { db, languagesTable, topicsTable, resourcesTable, articlesTable, quizzesTable, syntaxLessonsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [[totalLanguages], [totalTopics], [totalResources], [totalArticles], [totalQuizzes], [totalSyntaxLessons]] =
    await Promise.all([
      db.select({ count: count() }).from(languagesTable),
      db.select({ count: count() }).from(topicsTable),
      db.select({ count: count() }).from(resourcesTable),
      db.select({ count: count() }).from(articlesTable),
      db.select({ count: count() }).from(quizzesTable),
      db.select({ count: count() }).from(syntaxLessonsTable),
    ]);

  res.json({
    totalLanguages: totalLanguages?.count ?? 0,
    totalTopics: totalTopics?.count ?? 0,
    totalResources: totalResources?.count ?? 0,
    totalArticles: totalArticles?.count ?? 0,
    totalQuizzes: totalQuizzes?.count ?? 0,
    totalSyntaxLessons: totalSyntaxLessons?.count ?? 0,
  });
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const [rawResources, rawArticles, rawQuizzes] = await Promise.all([
    db
      .select({
        id: resourcesTable.id,
        title: resourcesTable.title,
        url: resourcesTable.url,
        type: resourcesTable.type,
        description: resourcesTable.description,
        languageId: resourcesTable.languageId,
        languageName: languagesTable.name,
        topicId: resourcesTable.topicId,
        tags: resourcesTable.tags,
        createdAt: resourcesTable.createdAt,
      })
      .from(resourcesTable)
      .leftJoin(languagesTable, eq(resourcesTable.languageId, languagesTable.id))
      .orderBy(resourcesTable.createdAt)
      .limit(5),
    db
      .select({
        id: articlesTable.id,
        title: articlesTable.title,
        content: articlesTable.content,
        summary: articlesTable.summary,
        languageId: articlesTable.languageId,
        languageName: languagesTable.name,
        tags: articlesTable.tags,
        createdAt: articlesTable.createdAt,
      })
      .from(articlesTable)
      .leftJoin(languagesTable, eq(articlesTable.languageId, languagesTable.id))
      .orderBy(articlesTable.createdAt)
      .limit(5),
    db
      .select({
        id: quizzesTable.id,
        title: quizzesTable.title,
        description: quizzesTable.description,
        articleId: quizzesTable.articleId,
        topicId: quizzesTable.topicId,
        languageId: quizzesTable.languageId,
        languageName: languagesTable.name,
        createdAt: quizzesTable.createdAt,
      })
      .from(quizzesTable)
      .leftJoin(languagesTable, eq(quizzesTable.languageId, languagesTable.id))
      .orderBy(quizzesTable.createdAt)
      .limit(5),
  ]);

  const resources = rawResources.map((r) => ({ ...r, topicTitle: null }));
  const articles = rawArticles.map((a) => ({ ...a, hasQuiz: false }));
  const quizzes = rawQuizzes.map((q) => ({ ...q, questionCount: null, questions: [] }));

  res.json({ resources, articles, quizzes });
});

router.get("/dashboard/language-progress", async (_req, res): Promise<void> => {
  const langs = await db.select().from(languagesTable).orderBy(languagesTable.id);

  const progress = await Promise.all(
    langs.map(async (lang) => {
      const [[topicCount], [resourceCount], [lessonCount], [quizCount]] = await Promise.all([
        db.select({ count: count() }).from(topicsTable).where(eq(topicsTable.languageId, lang.id)),
        db.select({ count: count() }).from(resourcesTable).where(eq(resourcesTable.languageId, lang.id)),
        db.select({ count: count() }).from(syntaxLessonsTable).where(eq(syntaxLessonsTable.languageId, lang.id)),
        db.select({ count: count() }).from(quizzesTable).where(eq(quizzesTable.languageId, lang.id)),
      ]);

      return {
        languageId: lang.id,
        languageName: lang.name,
        topicCount: topicCount?.count ?? 0,
        resourceCount: resourceCount?.count ?? 0,
        lessonCount: lessonCount?.count ?? 0,
        quizCount: quizCount?.count ?? 0,
      };
    })
  );

  res.json(progress);
});

export default router;
