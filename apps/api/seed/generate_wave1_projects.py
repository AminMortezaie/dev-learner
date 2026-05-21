#!/usr/bin/env python3
"""Generate Wave 1 project seed JSON (8 projects × 4 languages). Run from apps/api."""

from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parent / "data" / "projects"


def s(title: str, goal: str, instructions: str, snippets: list) -> dict:
    return {"title": title, "goal": goal, "instructions": instructions, "snippets": snippets}


def sn(path: str, code: str, action: str = "modify", label: str | None = None) -> dict:
    return {"path": path, "action": action, "label": label or path, "code": code}


def proj(slug: str, lang: str, title: str, desc: str, diff: str, code_lang: str, steps: list, playground: str | None = None) -> dict:
    return {
        "languageSlug": lang,
        "slug": slug,
        "title": title,
        "description": desc,
        "difficulty": diff,
        "codeLanguage": code_lang,
        "playgroundUrl": playground,
        "steps": steps,
    }


GOLANG = [
    proj(
        "worker-pool",
        "golang",
        "Worker Pool from Scratch",
        "Bounded worker pool: channels, goroutines, job dispatch, and graceful shutdown.",
        "intermediate",
        "go",
        [
            s("Entry point", "Empty compiles.", "Bootstrap `package main`.", [sn("main.go", "package main\n\nfunc main() {\n}\n", "create")]),
            s("Types and channels", "Job and result channels exist.", "Define `Job`, `Result`, buffered channels.", [sn("main.go", "package main\n\nconst numWorkers = 3\n\ntype Job struct{ ID int }\ntype Result struct{ JobID, Output int }\n\nfunc main() {\n\tjobs := make(chan Job, 10)\n\tresults := make(chan Result, 10)\n\t_, _ = jobs, results\n}\n", "modify")]),
            s("Worker function", "Workers process jobs.", "Loop `for job := range jobs`.", [sn("main.go", 'package main\n\nimport "fmt"\n\nconst numWorkers = 3\n\ntype Job struct{ ID int }\ntype Result struct{ JobID, Output int }\n\nfunc worker(id int, jobs <-chan Job, results chan<- Result) {\n\tfor job := range jobs {\n\t\tfmt.Printf("worker %d job %d\\n", id, job.ID)\n\t\tresults <- Result{job.ID, job.ID * job.ID}\n\t}\n}\n\nfunc main() {}\n', "modify")]),
            s("Run pool", "Jobs dispatched and collected.", "Start workers, enqueue, close, drain with WaitGroup.", [sn("main.go", 'package main\n\nimport ("fmt"; "sync")\n\nconst numWorkers = 3\n\ntype Job struct{ ID int }\ntype Result struct{ JobID, Output int }\n\nfunc worker(id int, jobs <-chan Job, results chan<- Result, wg *sync.WaitGroup) {\n\tdefer wg.Done()\n\tfor job := range jobs {\n\t\tresults <- Result{job.ID, job.ID * job.ID}\n\t}\n}\n\nfunc main() {\n\tjobs, results := make(chan Job, 10), make(chan Result, 10)\n\tvar wg sync.WaitGroup\n\tfor w := 1; w <= numWorkers; w++ {\n\t\twg.Add(1); go worker(w, jobs, results, &wg)\n\t}\n\tgo func() { wg.Wait(); close(results) }()\n\tfor j := 1; j <= 5; j++ { jobs <- Job{j} }\n\tclose(jobs)\n\tfor r := range results { fmt.Println(r) }\n}\n', "modify")]),
        ],
        "https://go.dev/play/",
    ),
    proj(
        "cli-todo",
        "golang",
        "CLI Todo with Flags",
        "File-backed todo list using the standard `flag` package and JSON persistence.",
        "beginner",
        "go",
        [
            s("Flags and store type", "Parse CLI flags.", "Use `flag` for `-list` and `-add`.", [sn("main.go", 'package main\n\nimport "flag"\n\nfunc main() {\n\tlist := flag.Bool("list", false, "list todos")\n\tadd := flag.String("add", "", "add todo")\n\tflag.Parse()\n\t_ = list; _ = add\n}\n', "create")]),
            s("Todo model", "Struct and slice store.", "Define `Todo` with ID and Title.", [sn("main.go", 'package main\n\nimport "flag"\n\ntype Todo struct {\n\tID int `json:"id"`\n\tTitle string `json:"title"`\n}\n\ntype Store struct { Items []Todo }\n\nfunc main() { flag.Parse() }\n', "modify")]),
            s("Add and list", "Mutate in memory.", "Append on `-add`, print on `-list`.", [sn("main.go", 'package main\n\nimport ("flag"; "fmt")\n\ntype Todo struct { ID int `json:"id"`; Title string `json:"title"` }\ntype Store struct { Items []Todo; nextID int }\n\nfunc (s *Store) Add(title string) { s.nextID++; s.Items = append(s.Items, Todo{s.nextID, title}) }\nfunc (s *Store) List() { for _, t := range s.Items { fmt.Printf("%d: %s\\n", t.ID, t.Title) } }\n\nfunc main() {\n\tstore := &Store{}\n\tadd := flag.String("add", "", "add todo")\n\tlist := flag.Bool("list", false, "list")\n\tflag.Parse()\n\tif *add != "" { store.Add(*add) }\n\tif *list { store.List() }\n}\n', "modify")]),
            s("Persist JSON", "Save and load from disk.", "Use `encoding/json` and `os.WriteFile`.", [sn("main.go", 'package main\n\nimport ("encoding/json"; "flag"; "fmt"; "os")\n\nconst path = "todos.json"\ntype Todo struct { ID int `json:"id"`; Title string `json:"title"` }\ntype Store struct { Items []Todo; nextID int }\n\nfunc Load() *Store { b, err := os.ReadFile(path); if err != nil { return &Store{} }; var s Store; json.Unmarshal(b, &s); return &s }\nfunc (s *Store) Save() { b, _ := json.MarshalIndent(s, "", "  "); os.WriteFile(path, b, 0644) }\nfunc (s *Store) Add(title string) { s.nextID++; s.Items = append(s.Items, Todo{s.nextID, title}); s.Save() }\nfunc (s *Store) List() { for _, t := range s.Items { fmt.Printf("%d: %s\\n", t.ID, t.Title) } }\n\nfunc main() {\n\tstore := Load()\n\tadd, list := flag.String("add", "", ""), flag.Bool("list", false, "")\n\tflag.Parse()\n\tif *add != "" { store.Add(*add) }\n\tif *list { store.List() }\n}\n', "modify")]),
        ],
        "https://go.dev/play/",
    ),
    proj(
        "http-middleware",
        "golang",
        "HTTP Server with Middleware",
        "Chain logging and request-ID middleware on `net/http` handlers.",
        "intermediate",
        "go",
        [
            s("Basic server", "Hello handler listens.", "Register `/` on `http.DefaultServeMux`.", [sn("main.go", 'package main\n\nimport ("fmt"; "net/http")\n\nfunc hello(w http.ResponseWriter, r *http.Request) {\n\tfmt.Fprintln(w, "hello")\n}\n\nfunc main() {\n\thttp.HandleFunc("/", hello)\n\thttp.ListenAndServe(":8080", nil)\n}\n', "create")]),
            s("Middleware type", "Wrap handlers.", "Define `Middleware func(http.Handler) http.Handler`.", [sn("main.go", 'package main\n\nimport "net/http"\n\ntype Middleware func(http.Handler) http.Handler\n\nfunc chain(h http.Handler, m ...Middleware) http.Handler {\n\tfor i := len(m)-1; i >= 0; i-- { h = m[i](h) }\n\treturn h\n}\n\nfunc hello(w http.ResponseWriter, r *http.Request) {}\nfunc main() {}\n', "modify")]),
            s("Logging middleware", "Log method and path.", "Wrap with timestamp and status.", [sn("middleware.go", 'package main\n\nimport (\n\t"log"\n\t"net/http"\n\t"time"\n)\n\nfunc logging(next http.Handler) http.Handler {\n\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n\t\tstart := time.Now()\n\t\tnext.ServeHTTP(w, r)\n\t\tlog.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))\n\t})\n}\n', "create")]),
            s("Request ID", "Propagate ID header.", "Set `X-Request-Id` in context.", [sn("main.go", 'package main\n\nimport ("fmt"; "net/http")\n\ntype Middleware func(http.Handler) http.Handler\nfunc chain(h http.Handler, m ...Middleware) http.Handler {\n\tfor i := len(m)-1; i >= 0; i-- { h = m[i](h) }; return h\n}\nfunc hello(w http.ResponseWriter, r *http.Request) { fmt.Fprintln(w, "ok") }\nfunc main() {\n\th := chain(http.HandlerFunc(hello), logging)\n\thttp.Handle("/", h)\n\thttp.ListenAndServe(":8080", nil)\n}\n', "modify"), sn("middleware.go", 'package main\n\nimport ("log"; "net/http"; "time")\n\nfunc logging(next http.Handler) http.Handler {\n\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n\t\tstart := time.Now()\n\t\tnext.ServeHTTP(w, r)\n\t\tlog.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))\n\t})\n}\n', "modify")]),
        ],
    ),
    proj(
        "json-rest-crud",
        "golang",
        "In-Memory JSON REST API",
        "CRUD HTTP API with `encoding/json` and a map-backed store.",
        "intermediate",
        "go",
        [
            s("Item model", "ID and name fields.", "Struct with JSON tags.", [sn("store.go", 'package main\n\ntype Item struct {\n\tID int `json:"id"`\n\tName string `json:"name"`\n}\n', "create")]),
            s("Memory store", "Thread-safe map.", "Protect with `sync.RWMutex`.", [sn("store.go", 'package main\n\nimport "sync"\n\ntype Item struct { ID int `json:"id"`; Name string `json:"name"` }\n\ntype Store struct {\n\tmu sync.RWMutex\n\titems map[int]Item\n\tnext int\n}\n\nfunc NewStore() *Store { return &Store{items: map[int]Item{}} }\nfunc (s *Store) Create(name string) Item {\n\ts.mu.Lock(); defer s.mu.Unlock()\n\ts.next++; it := Item{s.next, name}; s.items[it.ID] = it; return it\n}\n', "modify")]),
            s("List handler", "GET /items", "Encode slice as JSON.", [sn("handlers.go", 'package main\n\nimport ("encoding/json"; "net/http")\n\nfunc (s *Store) ListHandler(w http.ResponseWriter, r *http.Request) {\n\ts.mu.RLock(); defer s.mu.RUnlock()\n\tout := make([]Item, 0, len(s.items))\n\tfor _, it := range s.items { out = append(out, it) }\n\tjson.NewEncoder(w).Encode(out)\n}\n', "create")]),
            s("Create handler", "POST /items", "Decode body, return 201.", [sn("main.go", 'package main\n\nimport "net/http"\n\nfunc main() {\n\tstore := NewStore()\n\thttp.HandleFunc("/items", func(w http.ResponseWriter, r *http.Request) {\n\t\tswitch r.Method {\n\t\tcase http.MethodGet: store.ListHandler(w, r)\n\t\tcase http.MethodPost: store.CreateHandler(w, r)\n\t\tdefault: http.Error(w, "method", 405)\n\t\t}\n\t})\n\thttp.ListenAndServe(":8080", nil)\n}\n', "create"), sn("handlers.go", 'package main\n\nimport ("encoding/json"; "net/http")\n\nfunc (s *Store) CreateHandler(w http.ResponseWriter, r *http.Request) {\n\tvar in struct{ Name string `json:"name"` }\n\tif json.NewDecoder(r.Body).Decode(&in) != nil { http.Error(w, "bad json", 400); return }\n\tit := s.Create(in.Name)\n\tw.WriteHeader(201)\n\tjson.NewEncoder(w).Encode(it)\n}\n', "modify")]),
        ],
    ),
    proj(
        "rate-limiter",
        "golang",
        "Token Bucket Rate Limiter",
        "In-memory rate limiter using a ticker and token channel.",
        "intermediate",
        "go",
        [
            s("Limiter struct", "Bucket capacity.", "Fields: tokens chan, refill rate.", [sn("limiter.go", "package main\n\nimport \"time\"\n\ntype Limiter struct {\n\ttokens chan struct{}\n}\n", "create")]),
            s("Refill loop", "Background goroutine.", "Ticker adds tokens up to cap.", [sn("limiter.go", 'package main\n\nimport "time"\n\ntype Limiter struct { tokens chan struct{} }\n\nfunc NewLimiter(cap int, per time.Duration) *Limiter {\n\tl := &Limiter{tokens: make(chan struct{}, cap)}\n\tfor i := 0; i < cap; i++ { l.tokens <- struct{}{} }\n\tgo func() {\n\t\tt := time.NewTicker(per)\n\t\tfor range t.C { select { case l.tokens <- struct{}{}: default: } }\n\t}()\n\treturn l\n}\n', "modify")]),
            s("Allow method", "Block until token.", "Expose `Allow()` for callers.", [sn("limiter.go", 'package main\n\nimport "time"\n\ntype Limiter struct { tokens chan struct{} }\n\nfunc NewLimiter(cap int, per time.Duration) *Limiter {\n\tl := &Limiter{tokens: make(chan struct{}, cap)}\n\tfor i := 0; i < cap; i++ { l.tokens <- struct{}{} }\n\tgo func() {\n\t\tfor range time.NewTicker(per).C { select { case l.tokens <- struct{}{}: default: } }\n\t}()\n\treturn l\n}\nfunc (l *Limiter) Allow() { <-l.tokens }\n', "modify")]),
            s("HTTP gate", "Limit handler.", "Wrap handler with limiter.", [sn("main.go", 'package main\n\nimport ("fmt"; "net/http"; "time")\n\nfunc main() {\n\tlim := NewLimiter(3, time.Second)\n\thttp.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {\n\t\tlim.Allow()\n\t\tfmt.Fprintln(w, "ok")\n\t})\n\thttp.ListenAndServe(":8080", nil)\n}\n', "create")]),
        ],
    ),
    proj(
        "concurrent-fetcher",
        "golang",
        "Concurrent URL Fetcher",
        "Fan-out HTTP fetches with goroutines and a WaitGroup.",
        "intermediate",
        "go",
        [
            s("Fetch function", "GET one URL.", "Return status or error.", [sn("fetch.go", 'package main\n\nimport ("net/http"; "time")\n\nfunc fetch(url string) (int, error) {\n\tc := &http.Client{Timeout: 5 * time.Second}\n\tr, err := c.Get(url)\n\tif err != nil { return 0, err }\n\tdefer r.Body.Close()\n\treturn r.StatusCode, nil\n}\n', "create")]),
            s("Worker per URL", "One goroutine each.", "WaitGroup tracks completion.", [sn("main.go", 'package main\n\nimport ("fmt"; "sync")\n\nfunc main() {\n\turls := []string{"https://httpbin.org/get", "https://httpbin.org/delay/1"}\n\tvar wg sync.WaitGroup\n\tfor _, u := range urls {\n\t\twg.Add(1)\n\t\tgo func(url string) {\n\t\t\tdefer wg.Done()\n\t\t\tcode, err := fetch(url)\n\t\t\tfmt.Println(url, code, err)\n\t\t}(u)\n\t}\n\twg.Wait()\n}\n', "create")]),
            s("Collect results", "Channel of results.", "Avoid shared println race.", [sn("main.go", 'package main\n\nimport ("fmt"; "sync")\n\ntype Result struct{ URL string; Code int; Err error }\n\nfunc main() {\n\turls := []string{"https://httpbin.org/get", "https://httpbin.org/delay/1"}\n\tch := make(chan Result, len(urls))\n\tvar wg sync.WaitGroup\n\tfor _, u := range urls {\n\t\twg.Add(1)\n\t\tgo func(url string) {\n\t\t\tdefer wg.Done()\n\t\t\tcode, err := fetch(url)\n\t\t\tch <- Result{url, code, err}\n\t\t}(u)\n\t}\n\tgo func() { wg.Wait(); close(ch) }()\n\tfor r := range ch { fmt.Println(r) }\n}\n', "modify")]),
            s("Limit concurrency", "Semaphore pattern.", "Buffered channel as sem.", [sn("main.go", 'package main\n\nimport ("fmt"; "sync")\n\ntype Result struct{ URL string; Code int; Err error }\n\nfunc main() {\n\turls := []string{"https://httpbin.org/get", "https://httpbin.org/delay/1", "https://httpbin.org/get"}\n\tsem := make(chan struct{}, 2)\n\tch := make(chan Result, len(urls))\n\tvar wg sync.WaitGroup\n\tfor _, u := range urls {\n\t\twg.Add(1)\n\t\tgo func(url string) {\n\t\t\tdefer wg.Done()\n\t\t\tsem <- struct{}{}\n\t\t\tdefer func() { <-sem }()\n\t\t\tcode, err := fetch(url)\n\t\t\tch <- Result{url, code, err}\n\t\t}(u)\n\t}\n\tgo func() { wg.Wait(); close(ch) }()\n\tfor r := range ch { fmt.Println(r) }\n}\n', "modify")]),
        ],
    ),
    proj(
        "graceful-shutdown",
        "golang",
        "Graceful HTTP Shutdown",
        "Use `context`, OS signals, and `Server.Shutdown`.",
        "advanced",
        "go",
        [
            s("Server struct", "Configurable addr.", "Wrap `http.Server`.", [sn("main.go", 'package main\n\nimport ("net/http"; "time")\n\nfunc newServer() *http.Server {\n\tmux := http.NewServeMux()\n\tmux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })\n\treturn &http.Server{Addr: ":8080", Handler: mux, ReadHeaderTimeout: 5 * time.Second}\n}\n', "create")]),
            s("Start in goroutine", "Listen async.", "Log ListenAndServe errors except ErrServerClosed.", [sn("main.go", 'package main\n\nimport ("log"; "net/http"; "time")\n\nfunc run(srv *http.Server) {\n\tgo func() {\n\t\tif err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {\n\t\t\tlog.Fatal(err)\n\t\t}\n\t}()\n\tlog.Println("listening")\n}\n', "modify")]),
            s("Signal context", "Notify SIGINT.", "Use signal.NotifyContext.", [sn("main.go", 'package main\n\nimport (\n\t"context"\n\t"log"\n\t"net/http"\n\t"os"\n\t"os/signal"\n\t"syscall"\n\t"time"\n)\n\nfunc main() {\n\tctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)\n\tdefer stop()\n\tsrv := newServer()\n\trun(srv)\n\t<-ctx.Done()\n\tlog.Println("shutting down")\n\tshutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)\n\tdefer cancel()\n\t_ = srv.Shutdown(shutdown)\n}\n', "modify")]),
            s("Drain in-flight", "Shutdown timeout.", "Document 10s grace period.", [sn("main.go", 'package main\n\nimport (\n\t"context"\n\t"log"\n\t"net/http"\n\t"os"\n\t"os/signal"\n\t"syscall"\n\t"time"\n)\n\nfunc newServer() *http.Server {\n\tmux := http.NewServeMux()\n\tmux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })\n\treturn &http.Server{Addr: ":8080", Handler: mux, ReadHeaderTimeout: 5 * time.Second}\n}\n\nfunc main() {\n\tctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)\n\tdefer stop()\n\tsrv := newServer()\n\tgo func() { log.Println(srv.ListenAndServe()) }()\n\t<-ctx.Done()\n\tshCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)\n\tdefer cancel()\n\tif err := srv.Shutdown(shCtx); err != nil { log.Fatal(err) }\n\tlog.Println("stopped cleanly")\n}\n', "modify")]),
        ],
    ),
    proj(
        "error-wrapping",
        "golang",
        "Error Wrapping Pipeline",
        "Chain errors with `%w` and inspect with `errors.Is` / `errors.As`.",
        "advanced",
        "go",
        [
            s("Domain errors", "Sentinel errors.", "Var ErrNotFound.", [sn("errors.go", 'package main\n\nimport "errors"\n\nvar ErrNotFound = errors.New("not found")\n', "create")]),
            s("Repository layer", "Wrap DB errors.", "fmt.Errorf with %w.", [sn("repo.go", 'package main\n\nimport ("database/sql"; "fmt")\n\nfunc FindUser(db *sql.DB, id int) (string, error) {\n\tvar name string\n\terr := db.QueryRow("SELECT name FROM users WHERE id = ?", id).Scan(&name)\n\tif err == sql.ErrNoRows {\n\t\treturn "", fmt.Errorf("find user %d: %w", id, ErrNotFound)\n\t}\n\tif err != nil {\n\t\treturn "", fmt.Errorf("query user: %w", err)\n\t}\n\treturn name, nil\n}\n', "create")]),
            s("Service layer", "Add context.", "Wrap again at service.", [sn("service.go", 'package main\n\nimport ("database/sql"; "fmt")\n\nfunc GetDisplayName(db *sql.DB, id int) (string, error) {\n\tname, err := FindUser(db, id)\n\tif err != nil {\n\t\treturn "", fmt.Errorf("service get name: %w", err)\n\t}\n\treturn name, nil\n}\n', "create")]),
            s("HTTP mapping", "Map to status.", "errors.Is for 404.", [sn("main.go", 'package main\n\nimport ("errors"; "net/http")\n\nfunc userHandler(db *sql.DB) http.HandlerFunc {\n\treturn func(w http.ResponseWriter, r *http.Request) {\n\t\t_, err := GetDisplayName(db, 1)\n\t\tif errors.Is(err, ErrNotFound) {\n\t\t\thttp.Error(w, "not found", 404)\n\t\t\treturn\n\t\t}\n\t\tif err != nil {\n\t\t\thttp.Error(w, "internal", 500)\n\t\t\treturn\n\t\t}\n\t\tw.Write([]byte("ok"))\n\t}\n}\n', "create")]),
        ],
    ),
]

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "golang.json"
    path.write_text(json.dumps(GOLANG, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {path} ({len(GOLANG)} projects)")
    print("Also run: python3 seed/generate_wave1_jkp.py  # java, kotlin, python")
