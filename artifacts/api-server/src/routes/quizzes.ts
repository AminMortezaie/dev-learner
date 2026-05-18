import { Router, type IRouter } from "express";
import { db, quizzesTable, quizQuestionsTable, languagesTable } from "@workspace/db";
import { eq, and, type SQL } from "drizzle-orm";
import {
  ListQuizzesQueryParams,
  GetQuizParams,
  SubmitQuizAttemptParams,
  SubmitQuizAttemptBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/quizzes", async (req, res): Promise<void> => {
  const query = ListQuizzesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions: SQL[] = [];
  if (query.data.languageId) conditions.push(eq(quizzesTable.languageId, query.data.languageId));
  if (query.data.topicId) conditions.push(eq(quizzesTable.topicId, query.data.topicId));

  const quizzes = await db
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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(quizzesTable.createdAt);

  // Get question counts
  const result = await Promise.all(
    quizzes.map(async (quiz) => {
      const questions = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, quiz.id));
      return { ...quiz, questionCount: questions.length, questions: [] };
    })
  );

  res.json(result);
});

router.get("/quizzes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetQuizParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [quiz] = await db
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
    .where(eq(quizzesTable.id, params.data.id));

  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }

  const questions = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, quiz.id))
    .orderBy(quizQuestionsTable.orderIndex);

  res.json({
    ...quiz,
    questionCount: questions.length,
    questions: questions.map((q) => ({ ...q, options: q.options as string[] })),
  });
});

router.post("/quizzes/:id/attempt", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SubmitQuizAttemptParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SubmitQuizAttemptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const questions = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, params.data.id));

  if (questions.length === 0) {
    res.status(404).json({ error: "Quiz not found or has no questions" });
    return;
  }

  const questionMap = new Map(questions.map((q) => [q.id, q]));
  let correctCount = 0;

  const results = parsed.data.answers.map((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) return { questionId: answer.questionId, correct: false, correctAnswer: 0, explanation: null };
    const correct = answer.selectedAnswer === question.correctAnswer;
    if (correct) correctCount++;
    return {
      questionId: answer.questionId,
      correct,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation ?? null,
    };
  });

  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  res.json({
    score: Math.round(score * 10) / 10,
    totalQuestions,
    correctCount,
    passed: score >= 70,
    results,
  });
});

export default router;
