import { and, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  quizzesTable,
  quizQuestionsTable,
  languagesTable,
} from "@devlearn/database";
import { HttpError } from "../lib/errors.ts";

const PASS_THRESHOLD = 0.7;

const quizSelect = {
  id: quizzesTable.id,
  title: quizzesTable.title,
  description: quizzesTable.description,
  articleId: quizzesTable.articleId,
  topicId: quizzesTable.topicId,
  languageId: quizzesTable.languageId,
  createdAt: quizzesTable.createdAt,
  languageName: languagesTable.name,
};

export async function listQuizzes(filters: {
  languageId?: number;
  topicId?: number;
  articleId?: number;
}) {
  const { languageId, topicId, articleId } = filters;
  const where = [];
  if (languageId !== undefined) where.push(eq(quizzesTable.languageId, languageId));
  if (topicId !== undefined) where.push(eq(quizzesTable.topicId, topicId));
  if (articleId !== undefined) where.push(eq(quizzesTable.articleId, articleId));

  const rows = await db
    .select(quizSelect)
    .from(quizzesTable)
    .leftJoin(languagesTable, eq(languagesTable.id, quizzesTable.languageId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(quizzesTable.id);

  if (rows.length === 0) return [];

  const counts = await db
    .select({
      quizId: quizQuestionsTable.quizId,
      c: sql<number>`count(*)::int`,
    })
    .from(quizQuestionsTable)
    .where(inArray(quizQuestionsTable.quizId, rows.map((r) => r.id)))
    .groupBy(quizQuestionsTable.quizId);

  const countMap = new Map(counts.map((c) => [c.quizId, c.c]));

  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    questionCount: countMap.get(r.id) ?? 0,
  }));
}

export async function getQuiz(id: number) {
  const [quiz] = await db
    .select(quizSelect)
    .from(quizzesTable)
    .leftJoin(languagesTable, eq(languagesTable.id, quizzesTable.languageId))
    .where(eq(quizzesTable.id, id));
  if (!quiz) throw new HttpError(404, "Quiz not found");
  const questions = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, id))
    .orderBy(quizQuestionsTable.orderIndex, quizQuestionsTable.id);
  return {
    ...quiz,
    createdAt: quiz.createdAt ? quiz.createdAt.toISOString() : null,
    questionCount: questions.length,
    questions,
  };
}

export async function submitQuizAttempt(
  quizId: number,
  answers: Array<{ questionId: number; selectedAnswer: number }>,
) {
  const questions = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, quizId));
  if (questions.length === 0) throw new HttpError(404, "Quiz has no questions");

  const byId = new Map(questions.map((q) => [q.id, q]));
  const results = answers.map((a) => {
    const q = byId.get(a.questionId);
    if (!q) {
      return {
        questionId: a.questionId,
        correct: false,
        correctAnswer: -1,
        explanation: "Unknown question id",
      };
    }
    return {
      questionId: a.questionId,
      correct: a.selectedAnswer === q.correctAnswer,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation ?? null,
    };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const totalQuestions = questions.length;
  const score = correctCount / totalQuestions;

  return {
    score,
    totalQuestions,
    correctCount,
    passed: score >= PASS_THRESHOLD,
    results,
  };
}
