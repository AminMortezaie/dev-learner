/**
 * Senior-level topics per track. Topic titles are unique across the dataset
 * so the seed can resolve them by title when wiring quizzes/resources.
 */
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface TopicSeed {
  languageSlug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
}

export const TOPICS: TopicSeed[] = [
  // ---------------------------------------------------------------------
  // SYSTEM DESIGN
  // ---------------------------------------------------------------------
  {
    languageSlug: "system-design",
    title: "CAP theorem in practice",
    description:
      "Why CAP is a partition-time choice between availability and consistency, not a free choice between three. Real systems: Dynamo, Spanner, ZooKeeper.",
    difficulty: "intermediate",
    category: "Distributed Systems",
  },
  {
    languageSlug: "system-design",
    title: "Consensus with Raft",
    description:
      "Leader election, log replication, and safety properties. How etcd and Consul actually use Raft and what 'committed' means.",
    difficulty: "advanced",
    category: "Consensus",
  },
  {
    languageSlug: "system-design",
    title: "Designing for eventual consistency",
    description:
      "Read-your-writes, monotonic reads, causal consistency, and CRDTs. When eventual consistency is fine, and when it bites you.",
    difficulty: "advanced",
    category: "Consistency",
  },
  {
    languageSlug: "system-design",
    title: "Caching strategies",
    description:
      "Cache-aside, write-through, write-back, refresh-ahead. TTL vs. invalidation, the thundering herd problem, and request coalescing.",
    difficulty: "intermediate",
    category: "Performance",
  },
  {
    languageSlug: "system-design",
    title: "Message queues vs. event logs",
    description:
      "RabbitMQ-style queues vs. Kafka-style append-only logs: delivery semantics, ordering guarantees, consumer groups, and replay.",
    difficulty: "intermediate",
    category: "Messaging",
  },

  // ---------------------------------------------------------------------
  // JAVA
  // ---------------------------------------------------------------------
  {
    languageSlug: "java",
    title: "Java Memory Model",
    description:
      "happens-before, volatile, final-field semantics, and why naive double-checked locking was broken before JSR-133.",
    difficulty: "advanced",
    category: "Concurrency",
  },
  {
    languageSlug: "java",
    title: "Garbage collection internals",
    description:
      "G1, ZGC, Shenandoah: regions, evacuation, concurrent marking, pause-time targets and how to tune for tail latency.",
    difficulty: "advanced",
    category: "JVM",
  },
  {
    languageSlug: "java",
    title: "Virtual threads (Project Loom)",
    description:
      "JEP 444 virtual threads: scheduling, continuations, pinning, and what changes for blocking I/O and pooled executors.",
    difficulty: "intermediate",
    category: "Concurrency",
  },
  {
    languageSlug: "java",
    title: "Records, sealed types, and pattern matching",
    description:
      "Algebraic data types in modern Java: sealed hierarchies + records + pattern switches for exhaustive domain modeling.",
    difficulty: "intermediate",
    category: "Language",
  },
  {
    languageSlug: "java",
    title: "Streams and collectors deep-dive",
    description:
      "Spliterators, lazy evaluation, stateful vs. stateless ops, when to parallelize, and writing custom collectors.",
    difficulty: "intermediate",
    category: "Language",
  },

  // ---------------------------------------------------------------------
  // KOTLIN
  // ---------------------------------------------------------------------
  {
    languageSlug: "kotlin",
    title: "Coroutines and structured concurrency",
    description:
      "CoroutineScope, Job hierarchy, cancellation propagation, and why structured concurrency makes leaks much harder.",
    difficulty: "advanced",
    category: "Concurrency",
  },
  {
    languageSlug: "kotlin",
    title: "Flow vs. Channel vs. SharedFlow",
    description:
      "Cold flows, hot channels, conflated state. Choosing the right primitive for streams of values and back-pressure.",
    difficulty: "advanced",
    category: "Concurrency",
  },
  {
    languageSlug: "kotlin",
    title: "Sealed classes and exhaustive when",
    description:
      "Modeling closed hierarchies, replacing visitor patterns, and getting compiler-enforced exhaustiveness in branches.",
    difficulty: "intermediate",
    category: "Language",
  },
  {
    languageSlug: "kotlin",
    title: "Inline functions and reified generics",
    description:
      "How inline + reified avoids JVM type erasure for generics, and the performance trade-offs you actually pay.",
    difficulty: "advanced",
    category: "Language",
  },
  {
    languageSlug: "kotlin",
    title: "Kotlin DSL design",
    description:
      "Type-safe builders, extension functions, function literals with receiver, and the @DslMarker annotation.",
    difficulty: "intermediate",
    category: "Language",
  },

  // ---------------------------------------------------------------------
  // GO
  // ---------------------------------------------------------------------
  {
    languageSlug: "golang",
    title: "Goroutine scheduler (G-M-P)",
    description:
      "How Go's scheduler maps goroutines (G) onto OS threads (M) via processors (P), work-stealing, and netpoller integration.",
    difficulty: "advanced",
    category: "Runtime",
  },
  {
    languageSlug: "golang",
    title: "Channels and select",
    description:
      "Unbuffered vs. buffered channels, select for multiplexing, the for-range-channel idiom, and fan-out/fan-in patterns.",
    difficulty: "intermediate",
    category: "Concurrency",
  },
  {
    languageSlug: "golang",
    title: "Context propagation",
    description:
      "context.Context for deadlines, cancellation, and request-scoped values. Why context is always the first parameter.",
    difficulty: "intermediate",
    category: "Concurrency",
  },
  {
    languageSlug: "golang",
    title: "Interfaces and structural typing",
    description:
      "Go's interfaces are satisfied implicitly. Designing small interfaces, accepting interfaces and returning structs.",
    difficulty: "intermediate",
    category: "Language",
  },
  {
    languageSlug: "golang",
    title: "Errors as values",
    description:
      "errors.Is, errors.As, %w wrapping, and why panic is reserved for truly unrecoverable situations.",
    difficulty: "intermediate",
    category: "Language",
  },

  // ---------------------------------------------------------------------
  // PYTHON
  // ---------------------------------------------------------------------
  {
    languageSlug: "python",
    title: "The Global Interpreter Lock",
    description:
      "What the GIL protects, why CPython has one, how it affects CPU-bound vs. I/O-bound workloads, and the PEP 703 (no-GIL) work.",
    difficulty: "advanced",
    category: "Runtime",
  },
  {
    languageSlug: "python",
    title: "asyncio fundamentals",
    description:
      "Event loops, tasks, awaitables, cancellation, and the difference between asyncio.gather and asyncio.TaskGroup.",
    difficulty: "intermediate",
    category: "Concurrency",
  },
  {
    languageSlug: "python",
    title: "Descriptors and the data model",
    description:
      "Dunder methods, __get__/__set__/__delete__, how properties and ORMs are built on top of the descriptor protocol.",
    difficulty: "advanced",
    category: "Language",
  },
  {
    languageSlug: "python",
    title: "Typing and Protocols",
    description:
      "PEP 484 hints, structural typing with typing.Protocol, generics with TypeVar, and the role of mypy / pyright.",
    difficulty: "intermediate",
    category: "Language",
  },
  {
    languageSlug: "python",
    title: "Packaging in 2024+",
    description:
      "pyproject.toml, PEP 517/518, choosing between Poetry / uv / pip-tools / Hatch, and publishing to PyPI.",
    difficulty: "intermediate",
    category: "Tooling",
  },
];
