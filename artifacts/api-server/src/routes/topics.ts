import { Router, type IRouter } from "express";
import { db, topicsTable, languagesTable } from "@workspace/db";
import { eq, and, type SQL } from "drizzle-orm";
import {
  ListTopicsQueryParams,
  CreateTopicBody,
  GetTopicParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/topics", async (req, res): Promise<void> => {
  const query = ListTopicsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions: SQL[] = [];
  if (query.data.languageId) conditions.push(eq(topicsTable.languageId, query.data.languageId));
  if (query.data.difficulty) conditions.push(eq(topicsTable.difficulty, query.data.difficulty));

  const topics = await db
    .select({
      id: topicsTable.id,
      languageId: topicsTable.languageId,
      languageName: languagesTable.name,
      title: topicsTable.title,
      description: topicsTable.description,
      difficulty: topicsTable.difficulty,
      category: topicsTable.category,
      createdAt: topicsTable.createdAt,
    })
    .from(topicsTable)
    .leftJoin(languagesTable, eq(topicsTable.languageId, languagesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(topicsTable.id);

  res.json(topics);
});

router.post("/topics", async (req, res): Promise<void> => {
  const parsed = CreateTopicBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [topic] = await db.insert(topicsTable).values(parsed.data).returning();
  res.status(201).json(topic);
});

router.get("/topics/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTopicParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [topic] = await db
    .select({
      id: topicsTable.id,
      languageId: topicsTable.languageId,
      languageName: languagesTable.name,
      title: topicsTable.title,
      description: topicsTable.description,
      difficulty: topicsTable.difficulty,
      category: topicsTable.category,
      createdAt: topicsTable.createdAt,
    })
    .from(topicsTable)
    .leftJoin(languagesTable, eq(topicsTable.languageId, languagesTable.id))
    .where(eq(topicsTable.id, params.data.id));

  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }

  res.json(topic);
});

export default router;
