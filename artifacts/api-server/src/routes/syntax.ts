import { Router, type IRouter } from "express";
import { db, syntaxLessonsTable, languagesTable } from "@workspace/db";
import { eq, and, type SQL } from "drizzle-orm";
import {
  ListSyntaxLessonsQueryParams,
  GetSyntaxLessonParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/syntax-lessons", async (req, res): Promise<void> => {
  const query = ListSyntaxLessonsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions: SQL[] = [];
  if (query.data.languageId) conditions.push(eq(syntaxLessonsTable.languageId, query.data.languageId));
  if (query.data.difficulty) conditions.push(eq(syntaxLessonsTable.difficulty, query.data.difficulty));
  if (query.data.category) conditions.push(eq(syntaxLessonsTable.category, query.data.category));

  const lessons = await db
    .select({
      id: syntaxLessonsTable.id,
      languageId: syntaxLessonsTable.languageId,
      languageName: languagesTable.name,
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
    })
    .from(syntaxLessonsTable)
    .leftJoin(languagesTable, eq(syntaxLessonsTable.languageId, languagesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(syntaxLessonsTable.orderIndex);

  res.json(lessons);
});

router.get("/syntax-lessons/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSyntaxLessonParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lesson] = await db
    .select({
      id: syntaxLessonsTable.id,
      languageId: syntaxLessonsTable.languageId,
      languageName: languagesTable.name,
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
    })
    .from(syntaxLessonsTable)
    .leftJoin(languagesTable, eq(syntaxLessonsTable.languageId, languagesTable.id))
    .where(eq(syntaxLessonsTable.id, params.data.id));

  if (!lesson) {
    res.status(404).json({ error: "Syntax lesson not found" });
    return;
  }

  res.json(lesson);
});

export default router;
