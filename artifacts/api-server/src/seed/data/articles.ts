/**
 * 10 real-world articles relevant to the learning tracks. Each entry is a
 * curated summary in our own words (so we can store full content in the DB
 * without copying original text) plus a link to the original source for
 * full attribution in the resource list.
 */
export interface ArticleSeed {
  title: string;
  content: string;
  summary: string;
  languageSlug?: string;
  tags: string;
}

export const ARTICLES: ArticleSeed[] = [
  {
    title: "Notes on Distributed Systems for Young Bloods",
    summary:
      "Jeff Hodges' classic field guide: the unintuitive truths every engineer learns building real distributed systems.",
    languageSlug: "system-design",
    tags: "distributed-systems,war-stories",
    content: `# Notes on Distributed Systems for Young Bloods

Distributed systems are different from normal software in ways that are not always obvious. Jeff Hodges' 2013 essay collects the lessons engineers usually only learn the hard way.

## Coordination is expensive

Avoid it. Any time two nodes have to agree on something, you pay in latency and availability. Push state to the edges of the system; let nodes be authoritative for their own data and reconcile asynchronously when you can.

## Clocks are liars

Wall-clock time is not monotonic, is not synchronized across nodes, and can jump backwards. Use monotonic clocks for measuring durations, and prefer logical clocks (Lamport, vector) for ordering events across machines.

## Backpressure is your friend

If a downstream service slows down, queueing requests in front of it makes the problem worse, not better. Surface slowness up the stack so callers can shed load.

## Read the source

The original is at https://www.somethingsimilar.com/2013/01/14/notes-on-distributed-systems-for-young-bloods/`,
  },
  {
    title: "Designs, Lessons and Advice from Building Large Distributed Systems",
    summary:
      "Jeff Dean's now-classic Stanford talk on the numbers, patterns, and trade-offs behind Google-scale infrastructure.",
    languageSlug: "system-design",
    tags: "google,scale,latency",
    content: `# Designs, Lessons and Advice from Building Large Distributed Systems

Jeff Dean's talk popularized the now-famous "latency numbers every programmer should know" — L1 cache reference in 0.5 ns, main memory in ~100 ns, an SSD random read in ~150 us, a round-trip within the same datacenter in ~500 us, a round-trip CA → Netherlands in ~150 ms.

## Why the numbers matter

Designs that ignore the relative cost of disk, network, and memory always disappoint at scale. Caching is essentially a bet on these ratios; sharding is a bet on the cost of cross-shard fan-out.

## Recurring patterns

- Replicate everywhere for read scale, accept that writes are coordinated.
- Use sticky load balancing to keep caches warm.
- Pre-compute expensive aggregates; serve them from a fast lookup layer.
- Always have a backup request strategy for tail latency: fire a second request after the p95 deadline and use whichever returns first.

Source talk: https://research.google/pubs/designs-lessons-and-advice-from-building-large-distributed-systems/`,
  },
  {
    title: "Why the JVM Reigns Supreme on the Backend",
    summary:
      "A 2024 retrospective on why JVM-based services (Java, Kotlin, Scala, Clojure) still anchor most large engineering orgs.",
    languageSlug: "java",
    tags: "jvm,backend,career",
    content: `# Why the JVM Reigns Supreme on the Backend

Despite predictions of decline, the JVM continues to win at the high end of backend engineering. The reasons are pragmatic:

## Mature operations story

The JVM ships with the best toolchain in the industry for production diagnostics — JFR, async-profiler, jstack, heap dumps, GC logs. There is no equivalent depth in Go, Node, or Python ecosystems yet.

## Modern language choices

Today you can write JVM services in idiomatic, expressive Kotlin or modern Java 21 with records, sealed types, pattern switches, and virtual threads. The "verbose Java" stereotype no longer matches the reality.

## Ecosystem maturity

Kafka, Cassandra, Elasticsearch, Spark, Flink, and many of the foundational data systems people deploy run on the JVM. Operating those systems is materially easier from the JVM side.

## The trade-off

The cost is memory footprint and cold-start latency, which matter most in FaaS-style deployments. There, Go and Node still win.`,
  },
  {
    title: "Project Loom: Modern Scalable Concurrency for the JVM",
    summary:
      "An overview of JEP 444 virtual threads — what they are, what changes for application code, and the pitfalls to watch.",
    languageSlug: "java",
    tags: "loom,virtual-threads,concurrency",
    content: `# Project Loom: Modern Scalable Concurrency for the JVM

Virtual threads (delivered in JDK 21 via JEP 444) decouple the cost of a thread from the cost of an OS thread. A virtual thread is a regular java.lang.Thread, but the JVM scheduler unmounts it from its carrier when it blocks, and remounts it when it's ready to run again.

## What changes

The classic advice "use a thread pool sized to your CPUs" no longer applies for I/O-bound work. You can simply do thread-per-task: Executors.newVirtualThreadPerTaskExecutor() will happily run millions of in-flight tasks, as long as they spend most of their time blocked on I/O.

## What doesn't change

CPU-bound code still needs careful pool sizing — virtual threads don't make your CPU faster.

## Pitfalls: pinning

When a virtual thread executes a synchronized block while holding a blocking call, it cannot unmount — that's "pinning". Use ReentrantLock instead, or refactor to release the monitor before blocking.

Reference: https://openjdk.org/jeps/444`,
  },
  {
    title: "Kotlin Coroutines vs. Java Virtual Threads",
    summary:
      "Why both exist, how they differ in scheduling and ergonomics, and when to choose which on the JVM.",
    languageSlug: "kotlin",
    tags: "coroutines,loom,concurrency",
    content: `# Kotlin Coroutines vs. Java Virtual Threads

Both Kotlin coroutines and Java virtual threads address the same problem (cheap concurrent units of work), but they take very different routes.

## Coroutines are a compiler feature

The Kotlin compiler rewrites suspend functions into state machines that explicitly checkpoint at every suspension point. The runtime cost of a coroutine is just an object — no OS thread, no stack copying.

## Virtual threads are a runtime feature

A virtual thread is a JDK construct. It has a real Java stack and looks like a Thread to all existing code, including blocking I/O APIs. The JVM scheduler parks it when it blocks on a NIO-aware operation.

## Practical implications

- Coroutines compose with structured concurrency primitives (CoroutineScope, Job) the JDK does not have natively.
- Virtual threads work with the entire existing Java I/O stack — no need to use special suspend variants of every library.
- Both have a "pinning" problem with synchronized blocks; the workarounds are equivalent.

## When to pick which

In a pure Kotlin codebase, coroutines remain the better fit. In a mixed Kotlin/Java codebase or one that depends heavily on existing blocking libraries, virtual threads remove an entire compatibility headache.`,
  },
  {
    title: "Why Kubernetes Was Written in Go",
    summary:
      "A look at the language-level reasons Go fits the kind of long-running control-plane software Kubernetes is.",
    languageSlug: "golang",
    tags: "kubernetes,go,language-choice",
    content: `# Why Kubernetes Was Written in Go

When Kubernetes' predecessor (Borg) was open-sourced under a new name in 2014, Google chose Go for the rewrite. The reasons are still relevant for anyone choosing a language for infrastructure software.

## Concurrency primitives without ceremony

Goroutines and channels make controller loops natural. A typical Kubernetes controller is "watch the API server, reconcile observed state with desired state, repeat" — that is exactly what \`for { select { case <-watchCh: ... case <-time.After(period): ... } }\` is for.

## Static binaries, no runtime

A kube-apiserver binary contains everything it needs to run. No installed JVM, no Python interpreter, no dependency hell on the host.

## Interface satisfaction is implicit

Kubernetes APIs rely heavily on small interfaces (Lister, Reflector, Indexer). Go's structural typing lets you mix and match implementations without inheritance gymnastics.

## Trade-offs

Generics were missing until 2022; the Kubernetes codebase still bears scars in the form of code-generated typed clients. Error handling is verbose. But for control-plane workloads the trade was worth it.`,
  },
  {
    title: "How Discord Stores Trillions of Messages",
    summary:
      "Discord's 2023 migration from Cassandra to ScyllaDB and the lessons about tombstones, garbage collection, and hot partitions.",
    languageSlug: "system-design",
    tags: "discord,storage,case-study",
    content: `# How Discord Stores Trillions of Messages

In 2017 Discord moved to Cassandra. By 2022 they hit operational walls — tail latency under load, painful tombstones, and per-node GC behavior that drove on-call rotations. In 2023 they migrated to ScyllaDB, a C++ Cassandra-compatible store.

## What scaled poorly

- Tombstones piled up faster than compaction could remove them, hurting read latency on actively-deleted partitions.
- JVM GC pauses on multi-TB heaps were unpredictable; tuning was a never-ending project.
- Hot partitions during raids and large events were difficult to mitigate without app-level sharding.

## What ScyllaDB changed

- Shard-per-core architecture eliminated the multi-tenant lock contention.
- No JVM, so latency variance dropped dramatically.
- Same data model, similar driver story — migration risk was bounded.

## Lessons that transfer

Even when you're "just" running someone else's database, you eventually own its operational quirks. The lower-level the system, the more knowing the runtime matters.`,
  },
  {
    title: "The State of CPython: PEP 703 and the No-GIL Future",
    summary:
      "Sam Gross's per-interpreter GIL work, accepted as PEP 703, and what realistic adoption looks like for libraries.",
    languageSlug: "python",
    tags: "cpython,gil,pep-703",
    content: `# The State of CPython: PEP 703 and the No-GIL Future

PEP 703 was accepted in 2023, proposing a CPython build that runs without the Global Interpreter Lock. CPython 3.13 ships an experimental free-threaded build behind a configure flag.

## Why now

For a decade the answer was "the GIL has to stay or single-threaded code gets slower." Sam Gross's CPython fork demonstrated that with careful work — biased reference counting, per-object locking on critical mutable structures, deferred reference counting for very hot objects — the single-threaded overhead can be kept around 5-10%.

## What it means for libraries

C extensions that relied on the GIL for thread-safety (most of them, implicitly) will need explicit locks or atomic operations. NumPy, Cython, and the major scientific libraries have begun audits.

## What it means for application code

Pure-Python CPU-bound code finally scales across cores without multiprocessing.

## What stays the same

The free-threaded build is opt-in for the foreseeable future. Production deployments should not switch on it casually.`,
  },
  {
    title: "Building FastAPI: Why ASGI and Pydantic Won",
    summary:
      "Sebastián Ramírez on the trade-offs behind FastAPI's design and why Starlette + Pydantic became the new Flask + Marshmallow.",
    languageSlug: "python",
    tags: "fastapi,asgi,pydantic",
    content: `# Building FastAPI: Why ASGI and Pydantic Won

FastAPI is the fastest-growing Python web framework of the last five years. Its design choices are instructive:

## ASGI over WSGI

WSGI is fundamentally synchronous: one request, one thread, blocking I/O. ASGI generalizes to async + websockets + long-lived connections. FastAPI built on Starlette, which is pure async from the ground up.

## Pydantic for validation and docs

Type hints + Pydantic models do double duty: they validate input and they generate OpenAPI schemas. The "write your types once, get free validation and free docs" experience is the killer feature.

## Dependency injection without magic

FastAPI's Depends() is just a function call: a callable returns the dependency, and parameter types tell FastAPI how to wire them. There is no DI container, no decorator scanning — it's all standard Python.

## Honest trade-offs

The framework leans heavily on type hints, so codebases without them get little benefit. Pydantic v1 → v2 was a breaking migration that hit many users. The async-everywhere style requires async DB drivers, which are still maturing.`,
  },
  {
    title: "Why You Should Use Many Small Tables Instead of a Few Big Ones",
    summary:
      "A pragmatic argument for partitioning by tenant / time at the schema level when designing multi-tenant Postgres systems.",
    languageSlug: "system-design",
    tags: "postgres,partitioning,multitenancy",
    content: `# Why You Should Use Many Small Tables Instead of a Few Big Ones

Conventional wisdom says fewer, larger tables are easier to reason about. For high-write multi-tenant systems, the opposite often holds.

## Index maintenance

A B-tree index on a 5 TB table has worse insert latency than 50 indexes on 100 GB tables, because the latter fit comfortably in cache. Postgres native partitioning makes this transparent to the query.

## Vacuum and bloat

Vacuum work per table is proportional to the table's dead-tuple count. A noisy tenant won't drag vacuum throughput for everyone else if it's in its own partition.

## Schema-per-tenant or table-per-tenant?

Schema-per-tenant scales to thousands of tenants but breaks down at tens of thousands (catalog bloat, dump/restore pain). Table-per-tenant inside a shared schema scales further if you handle the migration tooling.

## When NOT to do this

If you have a small number of tenants (< 100) with similar workloads, the operational overhead of partitioning isn't worth it. Optimize for "boring single big table" until you have data telling you otherwise.`,
  },
];
