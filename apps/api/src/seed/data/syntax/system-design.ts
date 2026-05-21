import type { SyntaxLessonSeed } from "../syntax-lessons.ts";

/**
 * "Syntax" for system design is the canonical primitives engineers use: a
 * Raft message structure, a Kafka topic config, etc. Real-world links point
 * to the reference implementations.
 */
export const SYSTEM_DESIGN_LESSONS: SyntaxLessonSeed[] = [
  {
    languageSlug: "system-design",
    title: "Idempotency keys",
    concept: "Clients send a unique key so retried requests are applied at most once.",
    rawSyntax: `POST /payments
Idempotency-Key: 7c0f...e3
{
  "amount": 1299,
  "currency": "USD"
}`,
    explanation:
      "Server stores (idempotency_key → response) for a window (24h is common). A retry with the same key returns the cached response without re-charging. Stripe popularized this pattern.",
    realWorldExample: `# stripe-go — examples/idempotency
params := &stripe.PaymentIntentParams{Amount: stripe.Int64(1299)}
params.SetIdempotencyKey("order_4242_attempt_1")
pi, err := paymentintent.New(params)`,
    githubProject: "stripe/stripe-go — idempotency example",
    githubUrl: "https://github.com/stripe/stripe-go/blob/v79.12.0/README.md",
    difficulty: "intermediate",
    category: "API Design",
  },
  {
    languageSlug: "system-design",
    title: "Cache-aside pattern",
    concept: "Read from cache; on miss, load from DB, then write back to cache.",
    rawSyntax: `def get_user(id):
    if (u := cache.get(f"user:{id}")) is not None:
        return u
    u = db.fetch_user(id)
    cache.set(f"user:{id}", u, ttl=300)
    return u`,
    explanation:
      "Cache-aside puts the application in control. It's the default for read-heavy workloads. Watch for the thundering herd: when a hot key expires, many concurrent fetches can stampede the DB — use singleflight / coalescing.",
    realWorldExample: `// golang.org/x/sync/singleflight — used widely (e.g. Kubernetes) to dedupe
// concurrent cache fills.
v, err, _ := g.Do("user:42", func() (interface{}, error) {
    return db.FetchUser(42)
})`,
    githubProject: "golang/sync — singleflight",
    githubUrl:
      "https://github.com/golang/sync/blob/v0.8.0/singleflight/singleflight.go",
    difficulty: "intermediate",
    category: "Caching",
  },
  {
    languageSlug: "system-design",
    title: "Raft AppendEntries RPC",
    concept: "Leader replicates log entries to followers and tracks commitment.",
    rawSyntax: `AppendEntries(
  term, leaderId,
  prevLogIndex, prevLogTerm,
  entries[], leaderCommit
) -> (term, success)`,
    explanation:
      "Followers accept entries only if their log matches at prevLogIndex/prevLogTerm. Leader advances commitIndex once a majority has replicated the entry — that's when the entry is 'committed' and safe to apply.",
    realWorldExample: `// etcd-io/raft — raft.go (excerpt of the reference Raft impl)
type Message struct {
\tType    pb.MessageType
\tTo      uint64
\tFrom    uint64
\tTerm    uint64
\tLogTerm uint64
\tIndex   uint64
\tEntries []pb.Entry
\tCommit  uint64
}`,
    githubProject: "etcd-io/raft — raft.go",
    githubUrl: "https://github.com/etcd-io/raft/blob/v3.0.0/raft.go",
    difficulty: "advanced",
    category: "Consensus",
  },
  {
    languageSlug: "system-design",
    title: "Outbox pattern",
    concept: "Atomic DB write + outbox row; a relay publishes the row to a queue.",
    rawSyntax: `-- in the same transaction:
INSERT INTO orders (id, ...) VALUES (...);
INSERT INTO outbox  (id, topic, payload, created_at)
              VALUES (gen_random_uuid(), 'order.created', '{...}', now());`,
    explanation:
      "Avoids dual-write inconsistency between DB and message broker. A background process (Debezium, custom) reads outbox rows and publishes them, marking them sent. Combined with consumer idempotency you get effectively-once semantics.",
    realWorldExample: `# debezium/debezium-examples — outbox event router config
"transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
"transforms.outbox.route.by.field": "aggregatetype",
"transforms.outbox.table.field.event.payload": "payload"`,
    githubProject: "debezium/debezium-examples — outbox",
    githubUrl:
      "https://github.com/debezium/debezium-examples/tree/main/outbox",
    difficulty: "advanced",
    category: "Messaging",
  },
  {
    languageSlug: "system-design",
    title: "Consistent hashing",
    concept: "Map keys to nodes on a ring so adding/removing a node only moves K/N keys.",
    rawSyntax: `nodes = ["A", "B", "C"]
ring  = sorted((hash(n + ":" + str(i)), n)        # virtual nodes
               for n in nodes for i in range(128))

def lookup(key):
    h = hash(key)
    for (rh, node) in ring:
        if rh >= h: return node
    return ring[0][1]`,
    explanation:
      "Naive modulo hashing reshuffles ~all keys when N changes. Consistent hashing with virtual nodes spreads keys evenly and limits movement. Used by Dynamo, Cassandra, memcached clients, and modern load balancers.",
    realWorldExample: `// twitter/finagle uses Ketama (consistent hashing) for memcached clients
// https://github.com/twitter/finagle/tree/finagle-23.11.0/finagle-memcached
val client = Memcached.client
  .withKetamaClientBuilder(...) // ring-based partitioning
  .newRichClient("memcached!host1:11211,host2:11211")`,
    githubProject: "twitter/finagle — Ketama memcached",
    githubUrl:
      "https://github.com/twitter/finagle/tree/finagle-23.11.0/finagle-memcached",
    difficulty: "advanced",
    category: "Distributed Systems",
  },
];
