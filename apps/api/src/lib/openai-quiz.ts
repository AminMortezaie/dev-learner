/**
 * Generate a quiz from an article using an OpenAI-compatible AI provider.
 *
 * Strategy:
 *   1. If AI_API_KEY (or legacy OPENAI_API_KEY) is set, call the configured
 *      chat completions endpoint and ask the model to return strict JSON.
 *   2. Otherwise (or on any failure), fall back to a deterministic heuristic
 *      so the rest of the app stays functional offline.
 *
 * Provider config (env vars):
 *   AI_BASE_URL  - base URL of an OpenAI-compatible API (default: https://api.openai.com/v1)
 *   AI_API_KEY   - bearer token (falls back to OPENAI_API_KEY)
 *   AI_MODEL     - model name (falls back to OPENAI_MODEL, then gpt-4o-mini)
 */

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface GenerateOptions {
  title: string;
  content: string;
  /** Optional language/track context to bias question style. */
  language?: string | null;
  /** Override count; defaults to 10. */
  count?: number;
}

const DEFAULT_COUNT = 10;

function resolveAiConfig(): { apiKey: string; baseUrl: string; model: string } | null {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
  if (!apiKey) return null;
  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  return { apiKey, baseUrl, model };
}

// Groq free tier: 12K TPM limit. Keep input+output well under that per request.
const POLISH_CHUNK = 6_000; // ~1500 input tokens, leaving ~4K for output = ~5500 total

export async function polishContent(rawText: string): Promise<string> {
  const cfg = resolveAiConfig();
  if (!cfg) throw new Error("AI_API_KEY is required for content polishing");

  const system =
    "You are a technical writing editor. Reformat the given raw text as clean Markdown. " +
    "STRICT RULES: " +
    "1. Output ONLY the reformatted input text — nothing else. " +
    "2. Do NOT add introductions, conclusions, summaries, closing remarks, or any text not present in the input. " +
    "3. Do NOT omit or summarize any part of the input. " +
    "4. Only restructure: add ## headings, bullet lists, numbered lists, code blocks with language hints, **bold** for key terms. " +
    "5. Output raw Markdown text only — no JSON, no fences around the whole response, no commentary.";

  const chunks: string[] = [];
  for (let i = 0; i < rawText.length; i += POLISH_CHUNK) {
    chunks.push(rawText.slice(i, i + POLISH_CHUNK));
  }

  // Sequential to stay within TPM rate limits on free-tier providers
  const polishedChunks: string[] = [];
  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx]!;
    const result = await aiChat(cfg, [
      { role: "system", content: system },
      {
        role: "user",
        content: chunks.length > 1
          ? `Polish part ${idx + 1} of ${chunks.length}:\n\n${chunk}`
          : `Polish the following content:\n\n${chunk}`,
      },
    ], 4096, false);
    polishedChunks.push(result);
  }

  return polishedChunks.map(s => s.trim()).filter(Boolean).join("\n\n");
}

export async function generateQuizFromArticle(
  opts: GenerateOptions,
): Promise<GeneratedQuestion[]> {
  const count = opts.count ?? DEFAULT_COUNT;
  const cfg = resolveAiConfig();
  if (cfg) {
    try {
      return await generateQuizWithAI(opts, count, cfg);
    } catch (err) {
      console.warn(
        "[ai] Quiz generation failed, falling back to heuristic:",
        err instanceof Error ? err.message : err,
      );
    }
  }
  return generateHeuristic(opts, count);
}

// ---------------------------------------------------------------------------
// AI helper
// ---------------------------------------------------------------------------

async function aiChat(
  cfg: { apiKey: string; baseUrl: string; model: string },
  messages: Array<{ role: string; content: string }>,
  maxTokens = 512,
  json = true,
): Promise<string> {
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: cfg.model,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      temperature: 0.3,
      max_tokens: maxTokens,
      messages,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned no content");
  return content;
}

// ---------------------------------------------------------------------------
// AI path (quiz generation)
// ---------------------------------------------------------------------------

async function generateQuizWithAI(
  opts: GenerateOptions,
  count: number,
  cfg: { apiKey: string; baseUrl: string; model: string },
): Promise<GeneratedQuestion[]> {
  const langHint = opts.language ? ` The article is about ${opts.language}.` : "";

  const system =
    "You are an expert technical educator creating quizzes for senior software engineers. " +
    "You output ONLY valid JSON matching the requested schema. Do not include prose, " +
    "markdown fences, or commentary. Questions must test deep understanding, not trivia.";

  // Truncate content to ~6K chars (~1500 tokens) to stay within free-tier TPM limits.
  // Quiz JSON for 10 questions needs ~2K tokens max, so total stays under 12K.
  const contentSnippet = opts.content.slice(0, 6000);

  const user =
    `Generate exactly ${count} multiple-choice questions from the article below.${langHint} ` +
    `Requirements:\n` +
    `- Each question has exactly 4 plausible options.\n` +
    `- 'correctAnswer' is the 0-based index of the correct option.\n` +
    `- Include a 1–2 sentence 'explanation' grounded in the article.\n` +
    `- Avoid yes/no questions. Prefer 'why', 'when', and 'which is most accurate' framings.\n` +
    `\nReturn JSON: {"questions":[{"question":string,"options":[string,string,string,string],"correctAnswer":number,"explanation":string}]}\n` +
    `\n=== ARTICLE: ${opts.title} ===\n${contentSnippet}\n=== END ARTICLE ===`;

  const raw = await aiChat(cfg, [{ role: "system", content: system }, { role: "user", content: user }], 3072);
  const parsed = JSON.parse(raw) as { questions?: unknown };
  return validateQuestions(parsed.questions, count);
}

function validateQuestions(value: unknown, expected: number): GeneratedQuestion[] {
  if (!Array.isArray(value)) throw new Error("'questions' is not an array");
  const out: GeneratedQuestion[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const q = raw as Record<string, unknown>;
    const question = typeof q.question === "string" ? q.question.trim() : "";
    const options = Array.isArray(q.options)
      ? q.options.filter((x): x is string => typeof x === "string").map((s) => s.trim())
      : [];
    const correctAnswer =
      typeof q.correctAnswer === "number" ? Math.trunc(q.correctAnswer) : -1;
    const explanation =
      typeof q.explanation === "string" ? q.explanation.trim() : "";
    if (
      question &&
      options.length >= 2 &&
      correctAnswer >= 0 &&
      correctAnswer < options.length
    ) {
      out.push({ question, options, correctAnswer, explanation });
    }
  }
  if (out.length === 0) {
    throw new Error(`No valid questions in AI response (expected ${expected})`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Deterministic fallback
// ---------------------------------------------------------------------------

function generateHeuristic(
  opts: GenerateOptions,
  count: number,
): GeneratedQuestion[] {
  const sentences = splitSentences(opts.content);
  const keyTerms = extractKeyTerms(opts.content);
  const out: GeneratedQuestion[] = [];

  // Q1: title comprehension
  out.push({
    question: `What is the primary subject of "${opts.title}"?`,
    options: [
      summarize(opts.title, opts.content),
      "An unrelated framework comparison",
      "A historical retrospective of programming languages",
      "A bug report",
    ],
    correctAnswer: 0,
    explanation: `The article's title and opening sentences establish its primary subject.`,
  });

  // Q2..QN: sentence-based cloze
  for (let i = 0; i < Math.min(count - 1, sentences.length, keyTerms.length); i++) {
    const sentence = sentences[i];
    const term = keyTerms[i];
    if (!sentence.toLowerCase().includes(term.toLowerCase())) continue;
    const masked = sentence.replace(new RegExp(term, "i"), "____");
    const distractors = keyTerms
      .filter((t) => t.toLowerCase() !== term.toLowerCase())
      .slice(0, 3);
    const options = shuffleStable([term, ...distractors], i);
    const correctAnswer = options.indexOf(term);
    out.push({
      question: `Fill in the blank: ${masked}`,
      options,
      correctAnswer,
      explanation: `The article states: "${sentence.trim()}"`,
    });
  }

  // Pad if we still don't have enough
  while (out.length < count) {
    out.push({
      question: `According to the article, which statement is most accurate?`,
      options: [
        sentences[out.length % Math.max(1, sentences.length)]?.trim().slice(0, 140) ??
          opts.title,
        "The opposite of what the article claims",
        "A claim the article never makes",
        "An unrelated tangent",
      ],
      correctAnswer: 0,
      explanation: `Derived from sentence ${out.length + 1} of the article.`,
    });
  }

  return out.slice(0, count);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 280);
}

function extractKeyTerms(text: string): string[] {
  const STOP = new Set([
    "the","and","for","with","that","this","from","into","your","you","are","was",
    "but","not","have","has","can","will","would","could","should","may","might",
    "their","there","these","those","when","where","what","which","why","how","its",
    "it's","also","more","most","such","than","then","they","them","were","been",
  ]);
  const freq = new Map<string, number>();
  const tokens = text.match(/[A-Za-z][A-Za-z0-9_-]{3,}/g) ?? [];
  for (const t of tokens) {
    const lower = t.toLowerCase();
    if (STOP.has(lower)) continue;
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([k]) => k);
}

function summarize(title: string, content: string): string {
  const first = content.split(/(?<=[.!?])\s+/)[0]?.trim();
  if (first && first.length > 20) return first.slice(0, 160);
  return `An overview of ${title}`;
}

function shuffleStable<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = (seed * 9301 + 49297 + i) % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
