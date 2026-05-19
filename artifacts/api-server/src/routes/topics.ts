import { Router } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  topicsTable,
  languagesTable,
  insertTopicSchema,
} from "@workspace/db";
import { asyncHandler } from "../lib/async.ts";
import { HttpError } from "../lib/errors.ts";
import { parseIntParam, parseOptionalInt, parseOptionalString } from "../lib/parse.ts";

export const topicsRouter = Router();

topicsRouter.get(
  "/topics",
  asyncHandler(async (req, res) => {
    const languageId = parseOptionalInt(req.query.languageId);
    const difficulty = parseOptionalString(req.query.difficulty);

    const where = [];
    if (languageId !== undefined) where.push(eq(topicsTable.languageId, languageId));
    if (difficulty) where.push(eq(topicsTable.difficulty, difficulty));

    const rows = await db
      .select({
        id: topicsTable.id,
        languageId: topicsTable.languageId,
        title: topicsTable.title,
        description: topicsTable.description,
        difficulty: topicsTable.difficulty,
        category: topicsTable.category,
        createdAt: topicsTable.createdAt,
        languageName: languagesTable.name,
      })
      .from(topicsTable)
      .leftJoin(languagesTable, eq(languagesTable.id, topicsTable.languageId))
      .where(where.length ? and(...where) : undefined)
      .orderBy(topicsTable.id);

    res.json(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt ? r.createdAt.toISOString() : null,
      })),
    );
  }),
);

topicsRouter.post(
  "/topics",
  asyncHandler(async (req, res) => {
    const input = insertTopicSchema.parse(req.body);
    const [created] = await db.insert(topicsTable).values(input).returning();
    if (!created) throw new HttpError(500, "Failed to create topic");
    res.status(201).json({
      ...created,
      createdAt: created.createdAt ? created.createdAt.toISOString() : null,
    });
  }),
);

topicsRouter.get(
  "/topics/:id",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, "id");
    const [row] = await db
      .select({
        id: topicsTable.id,
        languageId: topicsTable.languageId,
        title: topicsTable.title,
        description: topicsTable.description,
        difficulty: topicsTable.difficulty,
        category: topicsTable.category,
        createdAt: topicsTable.createdAt,
        languageName: languagesTable.name,
      })
      .from(topicsTable)
      .leftJoin(languagesTable, eq(languagesTable.id, topicsTable.languageId))
      .where(eq(topicsTable.id, id));
    if (!row) throw new HttpError(404, "Topic not found");
    res.json({
      ...row,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    });
  }),
);
