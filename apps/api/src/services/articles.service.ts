import { and, eq, sql } from "drizzle-orm";
import {
  db,
  articlesTable,
  languagesTable,
  quizzesTable,
  quizQuestionsTable,
  type InsertArticle,
} from "@devlearn/database";
import { HttpError } from "../lib/errors.ts";
import { generateQuizFromArticle, polishContent } from "../lib/openai-quiz.ts";

const articleSelect = {
  id: articlesTable.id,
  title: articlesTable.title,
  content: articlesTable.content,
  summary: articlesTable.summary,
  languageId: articlesTable.languageId,
  tags: articlesTable.tags,
  createdAt: articlesTable.createdAt,
  languageName: languagesTable.name,
};

export async function serializeArticle(row: {
  id: number;
  createdAt: Date | null;
  [k: string]: unknown;
}) {
  const [q] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(quizzesTable)
    .where(eq(quizzesTable.articleId, row.id));
  return {
    ...row,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    hasQuiz: (q?.c ?? 0) > 0,
  };
}

export async function listArticles(languageId?: number) {
  const where = languageId !== undefined
    ? [eq(articlesTable.languageId, languageId)]
    : [];
  const rows = await db
    .select(articleSelect)
    .from(articlesTable)
    .leftJoin(languagesTable, eq(languagesTable.id, articlesTable.languageId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(articlesTable.id);
  return Promise.all(rows.map(serializeArticle));
}

export async function createArticle(
  articleData: InsertArticle,
  quizCount?: number,
) {
  const [article] = await db.insert(articlesTable).values(articleData).returning();
  if (!article) throw new HttpError(500, "Failed to create article");

  let languageName: string | null = null;
  if (article.languageId != null) {
    const [lang] = await db
      .select({ name: languagesTable.name })
      .from(languagesTable)
      .where(eq(languagesTable.id, article.languageId));
    languageName = lang?.name ?? null;
  }

  const questions = await generateQuizFromArticle({
    title: article.title,
    content: article.content,
    language: languageName,
    count: quizCount,
  });

  const [quiz] = await db
    .insert(quizzesTable)
    .values({
      title: `Quiz: ${article.title}`,
      description: `Auto-generated from article #${article.id}`,
      articleId: article.id,
      languageId: article.languageId ?? null,
    })
    .returning();
  if (quiz && questions.length > 0) {
    await db.insert(quizQuestionsTable).values(
      questions.map((q, i) => ({
        quizId: quiz.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        orderIndex: i,
      })),
    );
  }

  const [row] = await db
    .select(articleSelect)
    .from(articlesTable)
    .leftJoin(languagesTable, eq(languagesTable.id, articlesTable.languageId))
    .where(eq(articlesTable.id, article.id));
  return serializeArticle(row!);
}

export async function polishArticleContent(content: string) {
  try {
    const polished = await polishContent(content);
    return { content: polished };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429")) {
      const wait = msg.match(/try again in ([^."]+)/i)?.[1]?.trim();
      throw new HttpError(
        429,
        wait
          ? `AI rate limit reached. Try again in ${wait}.`
          : "AI rate limit reached. Please wait a minute and try again.",
      );
    }
    if (msg.includes("413")) {
      throw new HttpError(413, "Content too large for AI. Try with shorter content.");
    }
    throw new HttpError(500, msg.slice(0, 200));
  }
}

export async function getArticle(id: number) {
  const [row] = await db
    .select(articleSelect)
    .from(articlesTable)
    .leftJoin(languagesTable, eq(languagesTable.id, articlesTable.languageId))
    .where(eq(articlesTable.id, id));
  if (!row) throw new HttpError(404, "Article not found");
  return serializeArticle(row);
}

export async function deleteArticle(id: number) {
  const quizzes = await db
    .select({ id: quizzesTable.id })
    .from(quizzesTable)
    .where(eq(quizzesTable.articleId, id));
  for (const q of quizzes) {
    await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, q.id));
  }
  await db.delete(quizzesTable).where(eq(quizzesTable.articleId, id));
  const result = await db
    .delete(articlesTable)
    .where(eq(articlesTable.id, id))
    .returning({ id: articlesTable.id });
  if (result.length === 0) throw new HttpError(404, "Article not found");
}

export async function getArticleQuiz(articleId: number) {
  const [quiz] = await db
    .select()
    .from(quizzesTable)
    .where(eq(quizzesTable.articleId, articleId));
  if (!quiz) throw new HttpError(404, "No quiz for this article");
  const questions = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, quiz.id))
    .orderBy(quizQuestionsTable.orderIndex);
  return {
    ...quiz,
    createdAt: quiz.createdAt ? quiz.createdAt.toISOString() : null,
    questionCount: questions.length,
    questions,
  };
}
