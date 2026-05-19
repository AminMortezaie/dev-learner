import { Router } from "express";
import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  languagesTable,
  topicsTable,
  resourcesTable,
  articlesTable,
  quizzesTable,
  syntaxLessonsTable,
} from "@workspace/db";
import { asyncHandler } from "../lib/async.ts";

export const dashboardRouter = Router();

async function countOf(
  query: Promise<Array<{ c: number }>>,
): Promise<number> {
  const [r] = await query;
  return r?.c ?? 0;
}

const COUNT = { c: sql<number>`count(*)::int` };

dashboardRouter.get(
  "/dashboard/stats",
  asyncHandler(async (_req, res) => {
    const [totalTopics, totalResources, totalArticles, totalQuizzes, totalSyntaxLessons, totalLanguages] =
      await Promise.all([
        countOf(db.select(COUNT).from(topicsTable)),
        countOf(db.select(COUNT).from(resourcesTable)),
        countOf(db.select(COUNT).from(articlesTable)),
        countOf(db.select(COUNT).from(quizzesTable)),
        countOf(db.select(COUNT).from(syntaxLessonsTable)),
        countOf(db.select(COUNT).from(languagesTable)),
      ]);
    res.json({
      totalTopics,
      totalResources,
      totalArticles,
      totalQuizzes,
      totalSyntaxLessons,
      totalLanguages,
    });
  }),
);

dashboardRouter.get(
  "/dashboard/recent-activity",
  asyncHandler(async (_req, res) => {
    const RECENT = 5;
    const [resources, articles, quizzes] = await Promise.all([
      db
        .select({
          id: resourcesTable.id,
          title: resourcesTable.title,
          url: resourcesTable.url,
          type: resourcesTable.type,
          description: resourcesTable.description,
          languageId: resourcesTable.languageId,
          topicId: resourcesTable.topicId,
          tags: resourcesTable.tags,
          createdAt: resourcesTable.createdAt,
        })
        .from(resourcesTable)
        .orderBy(desc(resourcesTable.id))
        .limit(RECENT),
      db
        .select({
          id: articlesTable.id,
          title: articlesTable.title,
          content: articlesTable.content,
          summary: articlesTable.summary,
          languageId: articlesTable.languageId,
          tags: articlesTable.tags,
          createdAt: articlesTable.createdAt,
        })
        .from(articlesTable)
        .orderBy(desc(articlesTable.id))
        .limit(RECENT),
      db
        .select({
          id: quizzesTable.id,
          title: quizzesTable.title,
          description: quizzesTable.description,
          articleId: quizzesTable.articleId,
          topicId: quizzesTable.topicId,
          languageId: quizzesTable.languageId,
          createdAt: quizzesTable.createdAt,
        })
        .from(quizzesTable)
        .orderBy(desc(quizzesTable.id))
        .limit(RECENT),
    ]);

    const iso = <T extends { createdAt: Date | null }>(r: T) => ({
      ...r,
      createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    });

    res.json({
      resources: resources.map(iso),
      articles: articles.map(iso),
      quizzes: quizzes.map(iso),
    });
  }),
);

dashboardRouter.get(
  "/dashboard/language-progress",
  asyncHandler(async (_req, res) => {
    const langs = await db.select().from(languagesTable).orderBy(languagesTable.id);
    const out = await Promise.all(
      langs.map(async (l) => {
        const [t] = await db
          .select({ c: sql<number>`count(*)::int` })
          .from(topicsTable)
          .where(eq(topicsTable.languageId, l.id));
        const [r] = await db
          .select({ c: sql<number>`count(*)::int` })
          .from(resourcesTable)
          .where(eq(resourcesTable.languageId, l.id));
        const [s] = await db
          .select({ c: sql<number>`count(*)::int` })
          .from(syntaxLessonsTable)
          .where(eq(syntaxLessonsTable.languageId, l.id));
        const [q] = await db
          .select({ c: sql<number>`count(*)::int` })
          .from(quizzesTable)
          .where(eq(quizzesTable.languageId, l.id));
        return {
          languageId: l.id,
          languageName: l.name,
          topicCount: t?.c ?? 0,
          resourceCount: r?.c ?? 0,
          lessonCount: s?.c ?? 0,
          quizCount: q?.c ?? 0,
        };
      }),
    );
    res.json(out);
  }),
);
