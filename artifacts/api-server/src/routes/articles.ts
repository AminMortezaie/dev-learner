import { Router, type IRouter } from "express";
import { db, articlesTable, languagesTable, quizzesTable, quizQuestionsTable } from "@workspace/db";
import { eq, and, type SQL } from "drizzle-orm";
import {
  ListArticlesQueryParams,
  CreateArticleBody,
  GetArticleParams,
  DeleteArticleParams,
  GetArticleQuizParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/articles", async (req, res): Promise<void> => {
  const query = ListArticlesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions: SQL[] = [];
  if (query.data.languageId) conditions.push(eq(articlesTable.languageId, query.data.languageId));

  const articles = await db
    .select({
      id: articlesTable.id,
      title: articlesTable.title,
      content: articlesTable.content,
      summary: articlesTable.summary,
      languageId: articlesTable.languageId,
      languageName: languagesTable.name,
      tags: articlesTable.tags,
      createdAt: articlesTable.createdAt,
    })
    .from(articlesTable)
    .leftJoin(languagesTable, eq(articlesTable.languageId, languagesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(articlesTable.createdAt);

  // Check which have quizzes
  const quizArticleIds = new Set(
    (await db.select({ articleId: quizzesTable.articleId }).from(quizzesTable)).map((r) => r.articleId)
  );

  const result = articles.map((a) => ({ ...a, hasQuiz: quizArticleIds.has(a.id) }));
  res.json(result);
});

router.post("/articles", async (req, res): Promise<void> => {
  const parsed = CreateArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [article] = await db.insert(articlesTable).values(parsed.data).returning();
  res.status(201).json({ ...article, hasQuiz: false });
});

router.get("/articles/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetArticleParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [article] = await db
    .select({
      id: articlesTable.id,
      title: articlesTable.title,
      content: articlesTable.content,
      summary: articlesTable.summary,
      languageId: articlesTable.languageId,
      languageName: languagesTable.name,
      tags: articlesTable.tags,
      createdAt: articlesTable.createdAt,
    })
    .from(articlesTable)
    .leftJoin(languagesTable, eq(articlesTable.languageId, languagesTable.id))
    .where(eq(articlesTable.id, params.data.id));

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  const existingQuiz = await db.select({ id: quizzesTable.id }).from(quizzesTable).where(eq(quizzesTable.articleId, article.id));
  res.json({ ...article, hasQuiz: existingQuiz.length > 0 });
});

router.delete("/articles/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteArticleParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(articlesTable).where(eq(articlesTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.sendStatus(204);
});

// Auto-generate or fetch quiz from article
router.get("/articles/:id/quiz", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetArticleQuizParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [article] = await db.select().from(articlesTable).where(eq(articlesTable.id, params.data.id));
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  // Check if quiz already exists
  const existingQuizzes = await db
    .select()
    .from(quizzesTable)
    .where(eq(quizzesTable.articleId, article.id));

  if (existingQuizzes.length > 0) {
    const quiz = existingQuizzes[0];
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
    return;
  }

  // Auto-generate quiz from article content
  const generatedQuestions = generateQuestionsFromContent(article.title, article.content);

  const [newQuiz] = await db
    .insert(quizzesTable)
    .values({
      title: `Quiz: ${article.title}`,
      description: `Auto-generated quiz from the article "${article.title}"`,
      articleId: article.id,
      languageId: article.languageId,
    })
    .returning();

  const insertedQuestions = await db
    .insert(quizQuestionsTable)
    .values(generatedQuestions.map((q, i) => ({ ...q, quizId: newQuiz.id, orderIndex: i })))
    .returning();

  res.json({
    ...newQuiz,
    questionCount: insertedQuestions.length,
    questions: insertedQuestions.map((q) => ({ ...q, options: q.options as string[] })),
  });
});

function generateQuestionsFromContent(title: string, content: string): Omit<typeof quizQuestionsTable.$inferInsert, "quizId">[] {
  // Extract key concepts from content for question generation
  const sentences = content
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40);

  const questions: Omit<typeof quizQuestionsTable.$inferInsert, "quizId">[] = [];

  // Question about the topic itself
  questions.push({
    question: `What is the main topic covered in "${title}"?`,
    options: [
      title,
      "Database optimization techniques",
      "Frontend rendering patterns",
      "Network security protocols",
    ],
    correctAnswer: 0,
    explanation: `This article is specifically about "${title}".`,
    orderIndex: 0,
  });

  // Extract key terms from content
  const keywords = extractKeywords(content);

  if (keywords.length >= 2) {
    questions.push({
      question: `Which of the following concepts is discussed in this article?`,
      options: [
        keywords[0],
        "React hooks",
        "CSS animations",
        "SQL joins",
      ],
      correctAnswer: 0,
      explanation: `The article covers "${keywords[0]}" as one of its key concepts.`,
      orderIndex: 1,
    });
  }

  if (sentences.length > 0) {
    const sentence = sentences[0];
    const truncated = sentence.length > 100 ? sentence.substring(0, 100) + "..." : sentence;
    questions.push({
      question: `True or False: The article states: "${truncated}"`,
      options: ["True", "False", "Partially true", "Not mentioned"],
      correctAnswer: 0,
      explanation: `This is directly stated in the article content.`,
      orderIndex: 2,
    });
  }

  // Conceptual question
  questions.push({
    question: `Which audience is this article most relevant to?`,
    options: [
      "Senior software engineers and architects",
      "Marketing professionals",
      "Product managers",
      "UX designers",
    ],
    correctAnswer: 0,
    explanation: `DevLearn targets senior developers, and this article is written for that audience.`,
    orderIndex: 3,
  });

  if (keywords.length >= 1) {
    questions.push({
      question: `What best describes the purpose of "${keywords[0]}" in the context of this article?`,
      options: [
        "A key concept or technique discussed in the article",
        "An unrelated technology",
        "A deprecated approach",
        "A marketing term",
      ],
      correctAnswer: 0,
      explanation: `"${keywords[0]}" is one of the main concepts discussed in this article.`,
      orderIndex: 4,
    });
  }

  return questions.slice(0, 5);
}

function extractKeywords(content: string): string[] {
  const words = content
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 5)
    .map((w) => w.toLowerCase());

  const stopWords = new Set(["which", "where", "their", "there", "about", "these", "those", "should", "could", "would", "using", "based", "often", "every", "while"]);
  const freq: Record<string, number> = {};
  for (const word of words) {
    if (!stopWords.has(word)) freq[word] = (freq[word] ?? 0) + 1;
  }

  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

export default router;
