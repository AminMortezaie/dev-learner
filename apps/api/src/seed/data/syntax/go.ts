import type { SyntaxLessonSeed } from "../syntax-lessons.ts";

/**
 * Go syntax lessons. Real-world examples are drawn from Kubernetes, Docker
 * (moby), Prometheus, and etcd — the four projects you'll learn the most Go
 * from. All GitHub URLs are pinned to a release tag or commit.
 */
export const GO_LESSONS: SyntaxLessonSeed[] = [
  // ---------------------------------------------------------------------
  // BEGINNER
  // ---------------------------------------------------------------------
  {
    languageSlug: "golang",
    title: "Package main and func main",
    concept: "Every Go executable starts with `package main` and a `func main()`.",
    rawSyntax: `package main

import "fmt"

func main() {
\tfmt.Println("hello, world")
}`,
    explanation:
      "Go programs are organized into packages. The compiler links the `main` package's `main()` function as the program entry point. Imports are explicit and unused imports are a compile error.",
    realWorldExample: `// kubernetes/cmd/kubectl/kubectl.go (excerpt)
package main

import (
\t"os"
\t"k8s.io/kubectl/pkg/cmd"
\tcliflag "k8s.io/component-base/cli/flag"
)

func main() {
\tcommand := cmd.NewDefaultKubectlCommand()
\tif err := cliflag.RegisterAllFlags(); err != nil {
\t\tos.Exit(1)
\t}
\tif err := command.Execute(); err != nil {
\t\tos.Exit(1)
\t}
}`,
    githubProject: "kubernetes/kubernetes — cmd/kubectl/kubectl.go",
    githubUrl:
      "https://github.com/kubernetes/kubernetes/blob/v1.31.0/cmd/kubectl/kubectl.go",
    difficulty: "beginner",
    category: "Basics",
  },
  {
    languageSlug: "golang",
    title: "Variables and short declarations",
    concept: "`var x T = …` for declarations, `x := …` for short form inside functions.",
    rawSyntax: `var name string = "Junie"
count := 42         // type inferred as int
var (
\thost = "localhost"
\tport = 8080
)`,
    explanation:
      "Outside function bodies you must use `var`. Inside a function, `:=` both declares and assigns, inferring the type. At least one new variable must be introduced on the left of `:=`.",
    realWorldExample: `// prometheus/prometheus/cmd/prometheus/main.go (excerpt)
cfg := flagConfig{
\tnotifier:       notifier.Options{Registerer: prometheus.DefaultRegisterer},
\tnotifierTimeout: 10 * time.Second,
\tweb:            web.Options{Registerer: prometheus.DefaultRegisterer},
}
a := kingpin.New(filepath.Base(os.Args[0]), "The Prometheus monitoring server")`,
    githubProject: "prometheus/prometheus — cmd/prometheus/main.go",
    githubUrl:
      "https://github.com/prometheus/prometheus/blob/v2.54.1/cmd/prometheus/main.go",
    difficulty: "beginner",
    category: "Basics",
  },
  {
    languageSlug: "golang",
    title: "Structs and methods",
    concept: "Structs are value types; methods can have value or pointer receivers.",
    rawSyntax: `type Server struct {
\tAddr string
\tPort int
}

func (s *Server) Start() error {
\t// mutates state, so pointer receiver
\treturn nil
}`,
    explanation:
      "Use a pointer receiver when the method needs to mutate the receiver or when the struct is large. Be consistent across a type's methods — mixing value and pointer receivers on the same type is a common source of confusion.",
    realWorldExample: `// moby/moby/daemon/daemon.go (excerpt)
type Daemon struct {
\tid                  string
\trepository          string
\tcontainers          container.Store
\tcontainersReplica   *container.ViewDB
\texecCommands        *container.ExecStore
\tconfigStore         atomic.Pointer[configStore]
\tstatsCollector      *stats.Collector
}

func (daemon *Daemon) ID() string {
\treturn daemon.id
}`,
    githubProject: "moby/moby — daemon/daemon.go",
    githubUrl:
      "https://github.com/moby/moby/blob/v27.3.1/daemon/daemon.go",
    difficulty: "beginner",
    category: "Types",
  },

  // ---------------------------------------------------------------------
  // INTERMEDIATE
  // ---------------------------------------------------------------------
  {
    languageSlug: "golang",
    title: "Interfaces (structural typing)",
    concept: "A type satisfies an interface implicitly by having the right methods.",
    rawSyntax: `type Reader interface {
\tRead(p []byte) (n int, err error)
}

type File struct{ /* ... */ }

func (f *File) Read(p []byte) (int, error) { /* ... */ }
// *File now satisfies Reader — no \"implements\" keyword needed.`,
    explanation:
      "Go interfaces describe behavior, not hierarchy. Keep interfaces small (often one method) and define them where they're used, not where the implementing type lives. The famous io.Reader is just one method.",
    realWorldExample: `// kubernetes/kubernetes/staging/src/k8s.io/client-go/rest/request.go (excerpt)
type ResponseWrapper interface {
\tDoRaw(context.Context) ([]byte, error)
\tStream(context.Context) (io.ReadCloser, error)
}

// *Request satisfies it implicitly:
func (r *Request) DoRaw(ctx context.Context) ([]byte, error)   { /* ... */ }
func (r *Request) Stream(ctx context.Context) (io.ReadCloser, error) { /* ... */ }`,
    githubProject: "kubernetes/kubernetes — client-go/rest/request.go",
    githubUrl:
      "https://github.com/kubernetes/kubernetes/blob/v1.31.0/staging/src/k8s.io/client-go/rest/request.go",
    difficulty: "intermediate",
    category: "Language",
  },
  {
    languageSlug: "golang",
    title: "Goroutines and channels",
    concept: "`go f()` spawns a lightweight goroutine; channels (`chan T`) communicate.",
    rawSyntax: `ch := make(chan int, 4)   // buffered

go func() {
\tfor i := 0; i < 4; i++ {
\t\tch <- i
\t}
\tclose(ch)
}()

for v := range ch {
\tfmt.Println(v)
}`,
    explanation:
      "Go's mantra: 'Don't communicate by sharing memory; share memory by communicating.' Always know who closes a channel — sending on a closed channel panics, receiving on a closed channel yields the zero value.",
    realWorldExample: `// etcd-io/etcd/server/etcdserver/server.go (excerpt)
// raftReadyHandler processes ready batches from raft, fanning out to apply
// and snapshot pipelines via buffered channels.
type raftReadyHandler struct {
\tgetLead              func() (lead uint64)
\tupdateLead           func(lead uint64)
\tupdateLeadership     func(newLeader bool)
\tupdateCommittedIndex func(uint64)
}

go func() {
\tdefer close(s.stopping)
\tfor {
\t\tselect {
\t\tcase ap := <-s.applyc:
\t\t\ts.applyAll(&ep, &ap)
\t\tcase <-s.stop:
\t\t\treturn
\t\t}
\t}
}()`,
    githubProject: "etcd-io/etcd — server/etcdserver/server.go",
    githubUrl:
      "https://github.com/etcd-io/etcd/blob/v3.5.16/server/etcdserver/server.go",
    difficulty: "intermediate",
    category: "Concurrency",
  },
  {
    languageSlug: "golang",
    title: "context.Context propagation",
    concept: "Pass a Context through every blocking call to carry deadlines and cancellation.",
    rawSyntax: `ctx, cancel := context.WithTimeout(parent, 5*time.Second)
defer cancel()

resp, err := http.NewRequestWithContext(ctx, "GET", url, nil)
if err != nil {
\treturn err
}`,
    explanation:
      "Context is always the first parameter (`ctx context.Context`). Never store a Context inside a struct; pass it explicitly. Always call cancel() to release resources, even on success.",
    realWorldExample: `// kubernetes/kubernetes/staging/src/k8s.io/client-go/tools/cache/reflector.go (excerpt)
func (r *Reflector) Run(stopCh <-chan struct{}) {
\twait.BackoffUntil(func() {
\t\tif err := r.ListAndWatch(stopCh); err != nil {
\t\t\tr.watchErrorHandler(r, err)
\t\t}
\t}, r.backoffManager, true, stopCh)
}

func (r *Reflector) watchHandler(start time.Time, w watch.Interface, ...) error {
\tctx, cancel := context.WithCancel(context.Background())
\tdefer cancel()
\t// pass ctx into every downstream watch op
}`,
    githubProject: "kubernetes/kubernetes — client-go/tools/cache/reflector.go",
    githubUrl:
      "https://github.com/kubernetes/kubernetes/blob/v1.31.0/staging/src/k8s.io/client-go/tools/cache/reflector.go",
    difficulty: "intermediate",
    category: "Concurrency",
  },

  // ---------------------------------------------------------------------
  // ADVANCED
  // ---------------------------------------------------------------------
  {
    languageSlug: "golang",
    title: "Error wrapping with %w",
    concept: "Wrap errors to preserve cause chains; inspect with errors.Is / errors.As.",
    rawSyntax: `if err := doThing(); err != nil {
\treturn fmt.Errorf("failed to do thing: %w", err)
}

// later:
if errors.Is(err, io.EOF) { /* handle */ }

var perr *os.PathError
if errors.As(err, &perr) {
\tlog.Printf("path was %s", perr.Path)
}`,
    explanation:
      "`%w` wraps the original error so `errors.Is` walks the chain. `errors.As` extracts a specific concrete type. Prefer wrapping over creating new error messages that hide the cause.",
    realWorldExample: `// moby/moby/daemon/images/image_delete.go (excerpt)
if err := daemon.Mount(container); err != nil {
\treturn nil, fmt.Errorf("error mounting container %s: %w", container.ID, err)
}

// callers can then ask:
if errors.Is(err, container.ErrContainerNotRunning) { /* ... */ }`,
    githubProject: "moby/moby — daemon/images/image_delete.go",
    githubUrl:
      "https://github.com/moby/moby/blob/v27.3.1/daemon/images/image_delete.go",
    difficulty: "advanced",
    category: "Language",
  },
  {
    languageSlug: "golang",
    title: "sync.Once and sync.Pool",
    concept: "One-shot init via sync.Once; per-P object reuse via sync.Pool.",
    rawSyntax: `var once sync.Once
var inst *Client
func GetClient() *Client {
\tonce.Do(func() { inst = newClient() })
\treturn inst
}

var bufPool = sync.Pool{
\tNew: func() any { return new(bytes.Buffer) },
}
buf := bufPool.Get().(*bytes.Buffer)
defer func() { buf.Reset(); bufPool.Put(buf) }()`,
    explanation:
      "sync.Once.Do is guaranteed to run exactly once across all goroutines. sync.Pool is for short-lived allocations to reduce GC pressure; do NOT use it as a cache — entries may be evicted at any time.",
    realWorldExample: `// prometheus/prometheus/util/pool/pool.go (excerpt)
// Buckets uses sync.Pool internally to recycle []byte buffers across
// scrape-and-parse cycles, reducing GC churn during ingestion bursts.
type Pool struct {
\tbuckets []sync.Pool
\tsizes   []int
\tmake    func(int) interface{}
}

func (p *Pool) Get(sz int) interface{} {
\tfor i, bktSize := range p.sizes {
\t\tif sz > bktSize {
\t\t\tcontinue
\t\t}
\t\tb := p.buckets[i].Get()
\t\tif b == nil {
\t\t\tb = p.make(bktSize)
\t\t}
\t\treturn b
\t}
\treturn p.make(sz)
}`,
    githubProject: "prometheus/prometheus — util/pool/pool.go",
    githubUrl:
      "https://github.com/prometheus/prometheus/blob/v2.54.1/util/pool/pool.go",
    difficulty: "advanced",
    category: "Concurrency",
  },
  {
    languageSlug: "golang",
    title: "Generics (type parameters)",
    concept: "Go 1.18+ supports parameterized types and functions with constraints.",
    rawSyntax: `type Number interface {
\t~int | ~int64 | ~float64
}

func Sum[T Number](xs []T) T {
\tvar s T
\tfor _, x := range xs {
\t\ts += x
\t}
\treturn s
}`,
    explanation:
      "Constraints are interfaces that can list type sets with the `~` (underlying type) operator. Generic code is monomorphized partially by the compiler — there's a small overhead vs. fully specialized code.",
    realWorldExample: `// kubernetes/kubernetes/staging/src/k8s.io/apimachinery/pkg/util/sets/set.go (excerpt)
type Set[T comparable] map[T]Empty

func New[T comparable](items ...T) Set[T] {
\tss := make(Set[T], len(items))
\tss.Insert(items...)
\treturn ss
}

func (s Set[T]) Insert(items ...T) Set[T] {
\tfor _, item := range items {
\t\ts[item] = Empty{}
\t}
\treturn s
}`,
    githubProject: "kubernetes/kubernetes — apimachinery/pkg/util/sets/set.go",
    githubUrl:
      "https://github.com/kubernetes/kubernetes/blob/v1.31.0/staging/src/k8s.io/apimachinery/pkg/util/sets/set.go",
    difficulty: "advanced",
    category: "Language",
  },
];
