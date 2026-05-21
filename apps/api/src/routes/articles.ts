import { Router } from "express";
import { insertArticleSchema } from "@devlearn/database";
import {
  CreateArticleBody,
  PolishArticleContentBody,
} from "@devlearn/api-zod";
import { asyncHandler } from "../lib/async.ts";
import { parseIntParam, parseOptionalInt } from "../lib/parse.ts";
import * as articlesService from "../services/articles.service.ts";

export const articlesRouter = Router();

articlesRouter.get(
  "/articles",
  asyncHandler(async (req, res) => {
    const languageId = parseOptionalInt(req.query.languageId);
    res.json(await articlesService.listArticles(languageId));
  }),
);

articlesRouter.post(
  "/articles",
  asyncHandler(async (req, res) => {
    const { quizCount, ...body } = CreateArticleBody.parse(req.body);
    const articleData = insertArticleSchema.parse(body);
    const article = await articlesService.createArticle(articleData, quizCount);
    res.status(201).json(article);
  }),
);

articlesRouter.post(
  "/articles/polish",
  asyncHandler(async (req, res) => {
    const { content } = PolishArticleContentBody.parse(req.body);
    res.json(await articlesService.polishArticleContent(content));
  }),
);

articlesRouter.get(
  "/articles/:id",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, "id");
    res.json(await articlesService.getArticle(id));
  }),
);

articlesRouter.delete(
  "/articles/:id",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, "id");
    await articlesService.deleteArticle(id);
    res.status(204).end();
  }),
);

articlesRouter.get(
  "/articles/:id/quiz",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, "id");
    res.json(await articlesService.getArticleQuiz(id));
  }),
);
