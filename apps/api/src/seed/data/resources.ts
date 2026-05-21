/**
 * Curated external resources (docs, talks, books, articles) per track.
 * Each resource may be linked to a language and/or topic by slug/title.
 */
export type ResourceType =
  | "article"
  | "video"
  | "documentation"
  | "github"
  | "course"
  | "book";

export interface ResourceSeed {
  title: string;
  url: string;
  type: ResourceType;
  description: string;
  languageSlug?: string;
  topicTitle?: string;
  tags: string;
}

export const RESOURCES: ResourceSeed[] = [
  // ---------------- System Design ----------------
  {
    title: "Designing Data-Intensive Applications",
    url: "https://dataintensive.net/",
    type: "book",
    description:
      "Martin Kleppmann's deep treatment of replication, consensus, and storage engines — the standard reference for senior engineers.",
    languageSlug: "system-design",
    tags: "ddia,book,reference",
  },
  {
    title: "The Raft Consensus Algorithm",
    url: "https://raft.github.io/",
    type: "documentation",
    description:
      "Original Raft paper, talks, and an interactive visualization. Required reading for anyone touching distributed coordination.",
    languageSlug: "system-design",
    topicTitle: "Consensus with Raft",
    tags: "consensus,raft",
  },
  {
    title: "Amazon Dynamo paper",
    url: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf",
    type: "article",
    description:
      "Where consistent hashing + vector clocks + sloppy quorums + hinted handoff entered the mainstream of practitioner knowledge.",
    languageSlug: "system-design",
    tags: "dynamo,paper,consistency",
  },
  {
    title: "Jepsen analyses",
    url: "https://jepsen.io/analyses",
    type: "article",
    description:
      "Empirical safety analyses of real distributed databases under partitions and clock skew. Sobering and essential.",
    languageSlug: "system-design",
    tags: "jepsen,consistency,testing",
  },

  // ---------------- Java ----------------
  {
    title: "Java Language Specification (Java 21)",
    url: "https://docs.oracle.com/javase/specs/jls/se21/html/index.html",
    type: "documentation",
    description: "The canonical reference for what is and isn't valid Java.",
    languageSlug: "java",
    tags: "spec,reference",
  },
  {
    title: "JEP 444 — Virtual Threads",
    url: "https://openjdk.org/jeps/444",
    type: "documentation",
    description:
      "The JEP that landed virtual threads in JDK 21. Read it before tuning thread pools.",
    languageSlug: "java",
    topicTitle: "Virtual threads (Project Loom)",
    tags: "loom,virtual-threads,concurrency",
  },
  {
    title: "Java Memory Model Pragmatics — Aleksey Shipilëv",
    url: "https://shipilev.net/blog/2014/jmm-pragmatics/",
    type: "article",
    description:
      "The most useful practitioner's intro to the JMM — happens-before, fences, and what 'volatile' actually buys you.",
    languageSlug: "java",
    topicTitle: "Java Memory Model",
    tags: "jmm,concurrency",
  },
  {
    title: "Spring Framework",
    url: "https://github.com/spring-projects/spring-framework",
    type: "github",
    description:
      "The most-used dependency-injection / web framework on the JVM. A masterclass in API evolution.",
    languageSlug: "java",
    tags: "spring,framework",
  },

  // ---------------- Kotlin ----------------
  {
    title: "Kotlin Language Documentation",
    url: "https://kotlinlang.org/docs/home.html",
    type: "documentation",
    description: "Official Kotlin reference — concise and well-organized.",
    languageSlug: "kotlin",
    tags: "docs,reference",
  },
  {
    title: "kotlinx.coroutines guide",
    url: "https://github.com/Kotlin/kotlinx.coroutines/blob/master/docs/topics/coroutines-guide.md",
    type: "github",
    description:
      "Step-by-step from launch/async to Flow and structured concurrency, by the JetBrains team that built it.",
    languageSlug: "kotlin",
    topicTitle: "Coroutines and structured concurrency",
    tags: "coroutines,concurrency",
  },
  {
    title: "Ktor — async web framework",
    url: "https://github.com/ktorio/ktor",
    type: "github",
    description: "JetBrains-built coroutine-native HTTP server and client.",
    languageSlug: "kotlin",
    tags: "ktor,server",
  },

  // ---------------- Go ----------------
  {
    title: "Effective Go",
    url: "https://go.dev/doc/effective_go",
    type: "documentation",
    description:
      "Idiomatic Go from the Go team. Short, opinionated, and still the right first read.",
    languageSlug: "golang",
    tags: "idioms,docs",
  },
  {
    title: "The Go Memory Model",
    url: "https://go.dev/ref/mem",
    type: "documentation",
    description:
      "Updated for Go 1.19 atomics. Read this before writing anything with sync/atomic.",
    languageSlug: "golang",
    tags: "memory-model,concurrency",
  },
  {
    title: "Kubernetes source",
    url: "https://github.com/kubernetes/kubernetes",
    type: "github",
    description:
      "The largest production Go codebase. Read client-go and apimachinery for patterns you'll actually use.",
    languageSlug: "golang",
    tags: "kubernetes,real-world",
  },
  {
    title: "Docker (moby) source",
    url: "https://github.com/moby/moby",
    type: "github",
    description:
      "The container runtime engine. Daemon architecture, plugin system, and lots of OS-level Go.",
    languageSlug: "golang",
    tags: "docker,real-world",
  },
  {
    title: "Prometheus source",
    url: "https://github.com/prometheus/prometheus",
    type: "github",
    description:
      "A pull-based time-series DB and scraper. Excellent Go for high-throughput data pipelines.",
    languageSlug: "golang",
    tags: "prometheus,observability",
  },

  // ---------------- Python ----------------
  {
    title: "The Python Tutorial (official)",
    url: "https://docs.python.org/3/tutorial/index.html",
    type: "documentation",
    description: "The canonical reference, kept current with each release.",
    languageSlug: "python",
    tags: "docs,reference",
  },
  {
    title: "PEP 8 — Style Guide",
    url: "https://peps.python.org/pep-0008/",
    type: "documentation",
    description: "Indentation, naming, line length — settle these once and move on.",
    languageSlug: "python",
    tags: "style,pep",
  },
  {
    title: "Async IO in Python — Real Python",
    url: "https://realpython.com/async-io-python/",
    type: "article",
    description: "Practical introduction to asyncio with worked examples.",
    languageSlug: "python",
    topicTitle: "asyncio fundamentals",
    tags: "asyncio,concurrency",
  },
  {
    title: "CPython source",
    url: "https://github.com/python/cpython",
    type: "github",
    description:
      "The reference implementation. Read Objects/ and Python/ceval.c to understand how the bytecode loop actually works.",
    languageSlug: "python",
    tags: "cpython,internals",
  },
  {
    title: "FastAPI",
    url: "https://github.com/tiangolo/fastapi",
    type: "github",
    description: "Modern async web framework built on Starlette + Pydantic.",
    languageSlug: "python",
    tags: "fastapi,web",
  },
];
