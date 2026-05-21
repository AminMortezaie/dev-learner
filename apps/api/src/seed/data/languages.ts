/**
 * The five learning tracks. Slugs are stable identifiers used by the frontend
 * (e.g. /language/golang, /syntax/golang) and by the seed cross-references.
 */
export interface LanguageSeed {
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export const LANGUAGES: LanguageSeed[] = [
  {
    slug: "system-design",
    name: "System Design",
    description:
      "Distributed systems for senior engineers: consistency models, replication, " +
      "consensus, sharding, caching, message queues, and the trade-offs you actually " +
      "encounter in production.",
    color: "#94a3b8",
    icon: "Network",
  },
  {
    slug: "java",
    name: "Java",
    description:
      "JVM-native programming for the long haul: the memory model, garbage collection, " +
      "concurrency primitives, streams, modern features (records, sealed types, virtual " +
      "threads) and what production Java looks like in Netflix, Kafka, and Spring.",
    color: "#f97316",
    icon: "Coffee",
  },
  {
    slug: "kotlin",
    name: "Kotlin",
    description:
      "Pragmatic JVM with first-class coroutines, structured concurrency, sealed " +
      "hierarchies, and DSL-friendly syntax. Build server-side services with Ktor and " +
      "Spring, or share code across platforms with Kotlin Multiplatform.",
    color: "#a855f7",
    icon: "Workflow",
  },
  {
    slug: "golang",
    name: "Go",
    description:
      "Simple, statically-typed, garbage-collected language built for servers and " +
      "infrastructure. Goroutines, channels, interfaces by satisfaction, and the " +
      "language behind Kubernetes, Docker, Prometheus, and etcd.",
    color: "#14b8a6",
    icon: "Cpu",
  },
  {
    slug: "python",
    name: "Python",
    description:
      "Dynamic, batteries-included language dominating data, scripting, ML, and web. " +
      "The GIL, async/await, type hints, dataclasses, packaging, and how CPython, " +
      "Django, FastAPI, and pandas are actually structured.",
    color: "#60a5fa",
    icon: "Terminal",
  },
];
