import { Router, type IRouter } from "express";
import { db, resourcesTable, languagesTable, topicsTable } from "@workspace/db";
import { eq, and, type SQL } from "drizzle-orm";
import {
  ListResourcesQueryParams,
  CreateResourceBody,
  GetResourceParams,
  DeleteResourceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/resources", async (req, res): Promise<void> => {
  const query = ListResourcesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions: SQL[] = [];
  if (query.data.languageId) conditions.push(eq(resourcesTable.languageId, query.data.languageId));
  if (query.data.topicId) conditions.push(eq(resourcesTable.topicId, query.data.topicId));
  if (query.data.type) conditions.push(eq(resourcesTable.type, query.data.type));

  const resources = await db
    .select({
      id: resourcesTable.id,
      title: resourcesTable.title,
      url: resourcesTable.url,
      type: resourcesTable.type,
      description: resourcesTable.description,
      languageId: resourcesTable.languageId,
      languageName: languagesTable.name,
      topicId: resourcesTable.topicId,
      topicTitle: topicsTable.title,
      tags: resourcesTable.tags,
      createdAt: resourcesTable.createdAt,
    })
    .from(resourcesTable)
    .leftJoin(languagesTable, eq(resourcesTable.languageId, languagesTable.id))
    .leftJoin(topicsTable, eq(resourcesTable.topicId, topicsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(resourcesTable.createdAt);

  res.json(resources);
});

router.post("/resources", async (req, res): Promise<void> => {
  const parsed = CreateResourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [resource] = await db.insert(resourcesTable).values(parsed.data).returning();
  res.status(201).json(resource);
});

router.get("/resources/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetResourceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resource] = await db
    .select({
      id: resourcesTable.id,
      title: resourcesTable.title,
      url: resourcesTable.url,
      type: resourcesTable.type,
      description: resourcesTable.description,
      languageId: resourcesTable.languageId,
      languageName: languagesTable.name,
      topicId: resourcesTable.topicId,
      topicTitle: topicsTable.title,
      tags: resourcesTable.tags,
      createdAt: resourcesTable.createdAt,
    })
    .from(resourcesTable)
    .leftJoin(languagesTable, eq(resourcesTable.languageId, languagesTable.id))
    .leftJoin(topicsTable, eq(resourcesTable.topicId, topicsTable.id))
    .where(eq(resourcesTable.id, params.data.id));

  if (!resource) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  res.json(resource);
});

router.delete("/resources/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteResourceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(resourcesTable).where(eq(resourcesTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
