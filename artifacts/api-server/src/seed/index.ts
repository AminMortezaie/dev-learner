/**
 * Seed the Dev-Learn-Hub database with curated senior-level content for
 * System Design, Java, Kotlin, Go, and Python.
 *
 * Idempotency: the script deletes existing rows in dependency order and
 * re-inserts everything. Safe to run repeatedly in dev.
 *
 * Usage:  pnpm --filter @workspace/api-server run seed
 */
import { sql } from "drizzle-orm";
import {
  db,
  pool,
  languagesTable,
  topicsTable,
  resourcesTable,
  articlesTable,
  quizzesTable,
  quizQuestionsTable,
  syntaxLessonsTable,
} from "@workspace/db";
import { LANGUAGES } from "./data/languages.ts";
import { TOPICS } from "./data/topics.ts";
import { SYNTAX_LESSONS } from "./data/syntax-lessons.ts";
import { RESOURCES } from "./data/resources.ts";
import { ARTICLES } from "./data/articles.ts";
import { QUIZZES } from "./data/quizzes.ts";

async function reset(): Promise<void> {
  // Order matters: children → parents.
  console.log("[seed] truncating tables");
  await db.execute(sql`TRUNCATE TABLE
    quiz_questions,
    quizzes,
    syntax_lessons,
    resources,
    articles,
    topics,
    languages
    RESTART IDENTITY CASCADE`);
}

async function seed(): Promise<void> {
  const existing = await db.select({ id: languagesTable.id }).from(languagesTable).limit(1);
  if (existing.length > 0) {
    console.log("[seed] data already exists, skipping");
    return;
  }

  // 1) Languages
  console.log(`[seed] inserting ${LANGUAGES.length} languages`);
  const langRows = await db.insert(languagesTable).values(LANGUAGES).returning();
  const langBySlug = new Map(langRows.map((l) => [l.slug, l]));

  // 2) Topics (referenced by slug for FK resolution)
  const topicValues = TOPICS.map((t) => {
    const lang = langBySlug.get(t.languageSlug);
    if (!lang) throw new Error(`Unknown language slug: ${t.languageSlug}`);
    return {
      languageId: lang.id,
      title: t.title,
      description: t.description,
      difficulty: t.difficulty,
      category: t.category,
    };
  });
  console.log(`[seed] inserting ${topicValues.length} topics`);
  const topicRows = await db.insert(topicsTable).values(topicValues).returning();
  const topicByTitle = new Map(topicRows.map((t) => [t.title, t]));

  // 3) Syntax lessons
  const syntaxValues = SYNTAX_LESSONS.map((s, i) => {
    const lang = langBySlug.get(s.languageSlug);
    if (!lang) throw new Error(`Unknown language slug: ${s.languageSlug}`);
    return {
      languageId: lang.id,
      title: s.title,
      concept: s.concept,
      rawSyntax: s.rawSyntax,
      explanation: s.explanation,
      realWorldExample: s.realWorldExample,
      githubProject: s.githubProject,
      githubUrl: s.githubUrl,
      difficulty: s.difficulty,
      category: s.category,
      orderIndex: i,
    };
  });
  console.log(`[seed] inserting ${syntaxValues.length} syntax lessons`);
  await db.insert(syntaxLessonsTable).values(syntaxValues);

  // 4) Resources
  const resourceValues = RESOURCES.map((r) => ({
    title: r.title,
    url: r.url,
    type: r.type,
    description: r.description,
    languageId: r.languageSlug ? langBySlug.get(r.languageSlug)?.id ?? null : null,
    topicId: r.topicTitle ? topicByTitle.get(r.topicTitle)?.id ?? null : null,
    tags: r.tags,
  }));
  console.log(`[seed] inserting ${resourceValues.length} resources`);
  await db.insert(resourcesTable).values(resourceValues);

  // 5) Articles
  const articleValues = ARTICLES.map((a) => ({
    title: a.title,
    content: a.content,
    summary: a.summary,
    languageId: a.languageSlug ? langBySlug.get(a.languageSlug)?.id ?? null : null,
    tags: a.tags,
  }));
  console.log(`[seed] inserting ${articleValues.length} articles`);
  await db.insert(articlesTable).values(articleValues);

  // 6) Quizzes + questions (topic-bound)
  let quizCount = 0;
  let questionCount = 0;
  for (const q of QUIZZES) {
    const lang = langBySlug.get(q.languageSlug);
    if (!lang) throw new Error(`Unknown language slug: ${q.languageSlug}`);
    const topic = q.topicTitle ? topicByTitle.get(q.topicTitle) ?? null : null;
    const [quiz] = await db
      .insert(quizzesTable)
      .values({
        title: q.title,
        description: q.description,
        languageId: lang.id,
        topicId: topic?.id ?? null,
        articleId: null,
      })
      .returning();
    if (!quiz) throw new Error(`Failed to create quiz: ${q.title}`);
    quizCount++;
    if (q.questions.length > 0) {
      await db.insert(quizQuestionsTable).values(
        q.questions.map((qq, i) => ({
          quizId: quiz.id,
          question: qq.question,
          options: qq.options,
          correctAnswer: qq.correctAnswer,
          explanation: qq.explanation,
          orderIndex: i,
        })),
      );
      questionCount += q.questions.length;
    }
  }
  console.log(`[seed] inserted ${quizCount} quizzes with ${questionCount} questions`);

  console.log("[seed] done");
}

seed()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
