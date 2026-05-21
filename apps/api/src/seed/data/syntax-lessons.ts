/**
 * Syntax lessons paired with real-world examples drawn from well-known open-source
 * projects on GitHub. URLs are permalinks (pinned commit / tag) to keep them stable.
 */
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface SyntaxLessonSeed {
  languageSlug: string;
  title: string;
  concept: string;
  rawSyntax: string;
  explanation: string;
  realWorldExample: string;
  githubProject: string;
  githubUrl: string;
  difficulty: Difficulty;
  category: string;
}

import { GO_LESSONS } from "./syntax/go.ts";
import { JAVA_LESSONS } from "./syntax/java.ts";
import { KOTLIN_LESSONS } from "./syntax/kotlin.ts";
import { PYTHON_LESSONS } from "./syntax/python.ts";
import { SYSTEM_DESIGN_LESSONS } from "./syntax/system-design.ts";

export const SYNTAX_LESSONS: SyntaxLessonSeed[] = [
  ...GO_LESSONS,
  ...JAVA_LESSONS,
  ...KOTLIN_LESSONS,
  ...PYTHON_LESSONS,
  ...SYSTEM_DESIGN_LESSONS,
];
