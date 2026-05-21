import { Router } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  resourcesTable,
  languagesTable,
  topicsTable,
  insertResourceSchema,
} from "@devlearn/database";
import { CreateResourceBody } from "@devlearn/api-zod";
import { asyncHandler } from "../lib/async.ts";
import { HttpError } from "../lib/errors.ts";
import { parseIntParam, parseOptionalInt, parseOptionalString } from "../lib/parse.ts";

export const resourcesRouter = Router();

const resourceSelect = {
  id: resourcesTable.id,
  title: resourcesTable.title,
  url: resourcesTable.url,
  type: resourcesTable.type,
  description: resourcesTable.description,
  languageId: resourcesTable.languageId,
  topicId: resourcesTable.topicId,
  tags: resourcesTable.tags,
  createdAt: resourcesTable.createdAt,
  languageName: languagesTable.name,
  topicTitle: topicsTable.title,
};

function serializeResource(r: {
  createdAt: Date | null;
  [k: string]: unknown;
}) {
  return { ...r, createdAt: r.createdAt ? r.createdAt.toISOString() : null };
}

resourcesRouter.get(
  "/resources",
  asyncHandler(async (req, res) => {
    const languageId = parseOptionalInt(req.query.languageId);
    const topicId = parseOptionalInt(req.query.topicId);
    const type = parseOptionalString(req.query.type);

    const where = [];
    if (languageId !== undefined) where.push(eq(resourcesTable.languageId, languageId));
    if (topicId !== undefined) where.push(eq(resourcesTable.topicId, topicId));
    if (type) where.push(eq(resourcesTable.type, type));

    const rows = await db
      .select(resourceSelect)
      .from(resourcesTable)
      .leftJoin(languagesTable, eq(languagesTable.id, resourcesTable.languageId))
      .leftJoin(topicsTable, eq(topicsTable.id, resourcesTable.topicId))
      .where(where.length ? and(...where) : undefined)
      .orderBy(resourcesTable.id);

    res.json(rows.map(serializeResource));
  }),
);

resourcesRouter.post(
  "/resources",
  asyncHandler(async (req, res) => {
    const body = CreateResourceBody.parse(req.body);
    const input = insertResourceSchema.parse(body);
    const [created] = await db.insert(resourcesTable).values(input).returning();
    if (!created) throw new HttpError(500, "Failed to create resource");
    res.status(201).json(serializeResource(created));
  }),
);

resourcesRouter.get(
  "/resources/:id",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, "id");
    const [row] = await db
      .select(resourceSelect)
      .from(resourcesTable)
      .leftJoin(languagesTable, eq(languagesTable.id, resourcesTable.languageId))
      .leftJoin(topicsTable, eq(topicsTable.id, resourcesTable.topicId))
      .where(eq(resourcesTable.id, id));
    if (!row) throw new HttpError(404, "Resource not found");
    res.json(serializeResource(row));
  }),
);

resourcesRouter.delete(
  "/resources/:id",
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.id, "id");
    const result = await db
      .delete(resourcesTable)
      .where(eq(resourcesTable.id, id))
      .returning({ id: resourcesTable.id });
    if (result.length === 0) throw new HttpError(404, "Resource not found");
    res.status(204).end();
  }),
);
