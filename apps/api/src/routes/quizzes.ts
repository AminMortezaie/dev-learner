import { Router } from "express";
import { SubmitQuizAttemptBody } from "@devlearn/api-zod";
import { asyncHandler } from "../lib/async.ts";
import { parseIntParam, parseOptionalInt } from "../lib/parse.ts";
import * as quizzesService from "../services/quizzes.service.ts";

export const quizzesRouter = Router();

quizzesRouter.get(
  "/quizzes",
  asyncHandler(async (req, res) => {
    res.json(
      await quizzesService.listQuizzes({
        languageId: parseOptionalInt(req.query.languageId),
        topicId: parseOptionalInt(req.query.topicId),
        articleId: parseOptionalInt(req.query.articleId),
      }),
    );
  }),
);

quizzesRouter.get(
  "/quizzes/:id",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, "id");
    res.json(await quizzesService.getQuiz(id));
  }),
);

quizzesRouter.post(
  "/quizzes/:id/attempt",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, "id");
    const { answers } = SubmitQuizAttemptBody.parse(req.body);
    res.json(await quizzesService.submitQuizAttempt(id, answers));
  }),
);
