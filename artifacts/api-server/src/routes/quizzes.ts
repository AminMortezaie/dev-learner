import { Router } from "express";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod/v4";
import {
  db,
  quizzesTable,
  quizQuestionsTable,
  languagesTable,
} from "@workspace/db";
import { asyncHandler } from "../lib/async.ts";
import { HttpError } from "../lib/errors.ts";
import { parseIntParam, parseOptionalInt } from "../lib/parse.ts";

export const quizzesRouter = Router();

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

quizzesRouter.get(
  "/quizzes",
  asyncHandler(async (req, res) => {
    const languageId = parseOptionalInt(req.query.languageId);
    const topicId = parseOptionalInt(req.query.topicId);
    const articleId = parseOptionalInt(req.query.articleId);

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

    if (rows.length === 0) {
      res.json([]);
      return;
    }

    const counts = await db
      .select({
        quizId: quizQuestionsTable.quizId,
        c: sql<number>`count(*)::int`,
      })
      .from(quizQuestionsTable)
      .where(inArray(quizQuestionsTable.quizId, rows.map((r) => r.id)))
      .groupBy(quizQuestionsTable.quizId);

    const countMap = new Map(counts.map((c) => [c.quizId, c.c]));

    res.json(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt ? r.createdAt.toISOString() : null,
        questionCount: countMap.get(r.id) ?? 0,
      })),
    );
  }),
);

quizzesRouter.get(
  "/quizzes/:id",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, "id");
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
    res.json({
      ...quiz,
      createdAt: quiz.createdAt ? quiz.createdAt.toISOString() : null,
      questionCount: questions.length,
      questions,
    });
  }),
);

const attemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number().int().positive(),
        selectedAnswer: z.number().int().min(0),
      }),
    )
    .min(1),
});

quizzesRouter.post(
  "/quizzes/:id/attempt",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, "id");
    const { answers } = attemptSchema.parse(req.body);

    const questions = await db
      .select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quizId, id));
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

    res.json({
      score,
      totalQuestions,
      correctCount,
      passed: score >= PASS_THRESHOLD,
      results,
    });
  }),
);
