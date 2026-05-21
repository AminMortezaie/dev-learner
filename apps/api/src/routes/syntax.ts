import { Router } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  syntaxLessonsTable,
  languagesTable,
} from "@devlearn/database";
import { asyncHandler } from "../lib/async.ts";
import { HttpError } from "../lib/errors.ts";
import { parseIntParam, parseOptionalInt, parseOptionalString } from "../lib/parse.ts";

export const syntaxRouter = Router();

const syntaxSelect = {
  id: syntaxLessonsTable.id,
  languageId: syntaxLessonsTable.languageId,
  title: syntaxLessonsTable.title,
  concept: syntaxLessonsTable.concept,
  rawSyntax: syntaxLessonsTable.rawSyntax,
  explanation: syntaxLessonsTable.explanation,
  realWorldExample: syntaxLessonsTable.realWorldExample,
  githubProject: syntaxLessonsTable.githubProject,
  githubUrl: syntaxLessonsTable.githubUrl,
  difficulty: syntaxLessonsTable.difficulty,
  category: syntaxLessonsTable.category,
  orderIndex: syntaxLessonsTable.orderIndex,
  languageName: languagesTable.name,
};

syntaxRouter.get(
  "/syntax-lessons",
  asyncHandler(async (req, res) => {
    const languageId = parseOptionalInt(req.query.languageId);
    const difficulty = parseOptionalString(req.query.difficulty);
    const category = parseOptionalString(req.query.category);

    const where = [];
    if (languageId !== undefined) where.push(eq(syntaxLessonsTable.languageId, languageId));
    if (difficulty) where.push(eq(syntaxLessonsTable.difficulty, difficulty));
    if (category) where.push(eq(syntaxLessonsTable.category, category));

    const rows = await db
      .select(syntaxSelect)
      .from(syntaxLessonsTable)
      .leftJoin(languagesTable, eq(languagesTable.id, syntaxLessonsTable.languageId))
      .where(where.length ? and(...where) : undefined)
      .orderBy(syntaxLessonsTable.orderIndex, syntaxLessonsTable.id);

    res.json(rows);
  }),
);

syntaxRouter.get(
  "/syntax-lessons/:id",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, "id");
    const [row] = await db
      .select(syntaxSelect)
      .from(syntaxLessonsTable)
      .leftJoin(languagesTable, eq(languagesTable.id, syntaxLessonsTable.languageId))
      .where(eq(syntaxLessonsTable.id, id));
    if (!row) throw new HttpError(404, "Syntax lesson not found");
    res.json(row);
  }),
);
