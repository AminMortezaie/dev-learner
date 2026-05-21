#!/usr/bin/env python3
"""Generate Wave 1 Java, Kotlin, Python project seed JSON (8 projects each)."""

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


JAVA = [
    proj(
        "console-banking",
        "java",
        "Console Banking Account",
        "Model a bank account with deposit, withdraw, and balance checks in plain Java.",
        "beginner",
        "java",
        [
            s("Account class", "Account type compiles.", "Create an `Account` class with owner name and balance fields.", [sn("Account.java", "public class Account {\n    private final String owner;\n    private double balance;\n\n    public Account(String owner, double initial) {\n        this.owner = owner;\n        this.balance = initial;\n    }\n\n    public double getBalance() {\n        return balance;\n    }\n}\n", "create")]),
            s("Deposit and withdraw", "Mutations update balance.", "Add `deposit` and `withdraw` that reject negative amounts and insufficient funds.", [sn("Account.java", "public class Account {\n    private final String owner;\n    private double balance;\n\n    public Account(String owner, double initial) {\n        this.owner = owner;\n        this.balance = initial;\n    }\n\n    public void deposit(double amount) {\n        if (amount <= 0) throw new IllegalArgumentException(\"amount\");\n        balance += amount;\n    }\n\n    public void withdraw(double amount) {\n        if (amount <= 0) throw new IllegalArgumentException(\"amount\");\n        if (amount > balance) throw new IllegalStateException(\"insufficient\");\n        balance -= amount;\n    }\n\n    public double getBalance() { return balance; }\n}\n", "modify")]),
            s("Main demo", "CLI prints transactions.", "Wire a `Main` class that opens an account and prints balance after operations.", [sn("Main.java", "public class Main {\n    public static void main(String[] args) {\n        Account acc = new Account(\"Ada\", 100.0);\n        acc.deposit(50.0);\n        acc.withdraw(30.0);\n        System.out.println(\"balance=\" + acc.getBalance());\n    }\n}\n", "create")]),
            s("Transfer helper", "Move funds between accounts.", "Add a static `transfer` that withdraws from one account and deposits to another.", [sn("Account.java", "public class Account {\n    private final String owner;\n    private double balance;\n\n    public Account(String owner, double initial) {\n        this.owner = owner;\n        this.balance = initial;\n    }\n\n    public void deposit(double amount) {\n        if (amount <= 0) throw new IllegalArgumentException(\"amount\");\n        balance += amount;\n    }\n\n    public void withdraw(double amount) {\n        if (amount <= 0) throw new IllegalArgumentException(\"amount\");\n        if (amount > balance) throw new IllegalStateException(\"insufficient\");\n        balance -= amount;\n    }\n\n    public static void transfer(Account from, Account to, double amount) {\n        from.withdraw(amount);\n        to.deposit(amount);\n    }\n\n    public double getBalance() { return balance; }\n    public String getOwner() { return owner; }\n}\n", "modify"), sn("Main.java", "public class Main {\n    public static void main(String[] args) {\n        Account a = new Account(\"Ada\", 100.0);\n        Account b = new Account(\"Bob\", 20.0);\n        Account.transfer(a, b, 25.0);\n        System.out.println(a.getOwner() + \"=\" + a.getBalance());\n        System.out.println(b.getOwner() + \"=\" + b.getBalance());\n    }\n}\n", "modify")]),
        ],
    ),
    proj(
        "stream-etl",
        "java",
        "Stream CSV ETL",
        "Parse CSV lines and uppercase names using Java Streams.",
        "intermediate",
        "java",
        [
            s("Record model", "CsvRow exists.", "Define a simple `CsvRow` record with id and name.", [sn("CsvRow.java", "public record CsvRow(int id, String name) {\n    public static CsvRow parse(String line) {\n        String[] parts = line.split(\",\");\n        return new CsvRow(Integer.parseInt(parts[0].trim()), parts[1].trim());\n    }\n}\n", "create")]),
            s("Parse lines", "List of rows.", "Read sample lines into a `List<CsvRow>`.", [sn("Etl.java", "import java.util.List;\n\npublic class Etl {\n    public static void main(String[] args) {\n        List<String> lines = List.of(\"1,ada\", \"2,bob\", \"3,cara\");\n        List<CsvRow> rows = lines.stream().map(CsvRow::parse).toList();\n        System.out.println(rows.size());\n    }\n}\n", "create")]),
            s("Uppercase transform", "Stream map.", "Map names to uppercase with `.map`.", [sn("Etl.java", "import java.util.List;\n\npublic class Etl {\n    public static void main(String[] args) {\n        List<String> lines = List.of(\"1,ada\", \"2,bob\");\n        List<String> out = lines.stream()\n            .map(CsvRow::parse)\n            .map(r -> r.id() + \",\" + r.name().toUpperCase())\n            .toList();\n        out.forEach(System.out::println);\n    }\n}\n", "modify")]),
            s("Filter and collect", "ETL pipeline.", "Skip empty names, collect to a new list, print joined output.", [sn("Etl.java", "import java.util.List;\nimport java.util.stream.Collectors;\n\npublic class Etl {\n    public static void main(String[] args) {\n        List<String> lines = List.of(\"1,ada\", \"2,\", \"3,cara\");\n        String result = lines.stream()\n            .map(CsvRow::parse)\n            .filter(r -> !r.name().isBlank())\n            .map(r -> r.id() + \",\" + r.name().toUpperCase())\n            .collect(Collectors.joining(\"\\n\"));\n        System.out.println(result);\n    }\n}\n", "modify")]),
        ],
    ),
    proj(
        "thread-safe-cache",
        "java",
        "Thread-Safe Cache",
        "Build a cache with `ConcurrentHashMap` and atomic compute operations.",
        "intermediate",
        "java",
        [
            s("Cache skeleton", "Generic cache type.", "Wrap `ConcurrentHashMap` in a `Cache<K,V>` class.", [sn("Cache.java", "import java.util.concurrent.ConcurrentHashMap;\n\npublic class Cache<K, V> {\n    private final ConcurrentHashMap<K, V> map = new ConcurrentHashMap<>();\n\n    public V get(K key) {\n        return map.get(key);\n    }\n}\n", "create")]),
            s("Put and get", "Basic CRUD.", "Add `put` and `getOrDefault` methods.", [sn("Cache.java", "import java.util.concurrent.ConcurrentHashMap;\n\npublic class Cache<K, V> {\n    private final ConcurrentHashMap<K, V> map = new ConcurrentHashMap<>();\n\n    public void put(K key, V value) {\n        map.put(key, value);\n    }\n\n    public V getOrDefault(K key, V fallback) {\n        return map.getOrDefault(key, fallback);\n    }\n}\n", "modify")]),
            s("Compute if absent", "Loader pattern.", "Use `computeIfAbsent` to load values once per key.", [sn("Cache.java", "import java.util.concurrent.ConcurrentHashMap;\nimport java.util.function.Function;\n\npublic class Cache<K, V> {\n    private final ConcurrentHashMap<K, V> map = new ConcurrentHashMap<>();\n\n    public V getOrLoad(K key, Function<K, V> loader) {\n        return map.computeIfAbsent(key, loader);\n    }\n}\n", "modify")]),
            s("Demo main", "Concurrent readers.", "Simulate parallel access from `Main`.", [sn("Main.java", "public class Main {\n    public static void main(String[] args) {\n        Cache<String, String> cache = new Cache<>();\n        String v1 = cache.getOrLoad(\"user:1\", k -> \"loaded-\" + k);\n        String v2 = cache.getOrLoad(\"user:1\", k -> \"should-not-run\");\n        System.out.println(v1);\n        System.out.println(v2);\n    }\n}\n", "create"), sn("Cache.java", "import java.util.concurrent.ConcurrentHashMap;\nimport java.util.function.Function;\n\npublic class Cache<K, V> {\n    private final ConcurrentHashMap<K, V> map = new ConcurrentHashMap<>();\n\n    public V getOrLoad(K key, Function<K, V> loader) {\n        return map.computeIfAbsent(key, loader);\n    }\n}\n", "modify")]),
        ],
    ),
    proj(
        "completable-future-aggregator",
        "java",
        "CompletableFuture Aggregator",
        "Combine two async supplies with `CompletableFuture`.",
        "advanced",
        "java",
        [
            s("Async supplies", "Two delayed tasks.", "Create suppliers that sleep and return strings.", [sn("Aggregator.java", "import java.util.concurrent.CompletableFuture;\n\npublic class Aggregator {\n    static CompletableFuture<String> fetchA() {\n        return CompletableFuture.supplyAsync(() -> {\n            sleep(200);\n            return \"A\";\n        });\n    }\n\n    static void sleep(long ms) {\n        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }\n    }\n}\n", "create")]),
            s("Second supply", "Parallel fetch B.", "Add `fetchB` with a different delay.", [sn("Aggregator.java", "import java.util.concurrent.CompletableFuture;\n\npublic class Aggregator {\n    static CompletableFuture<String> fetchA() {\n        return CompletableFuture.supplyAsync(() -> { sleep(200); return \"A\"; });\n    }\n\n    static CompletableFuture<String> fetchB() {\n        return CompletableFuture.supplyAsync(() -> { sleep(300); return \"B\"; });\n    }\n\n    static void sleep(long ms) {\n        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }\n    }\n}\n", "modify")]),
            s("Combine results", "allOf and join.", "Wait for both futures and merge strings.", [sn("Aggregator.java", "import java.util.concurrent.CompletableFuture;\n\npublic class Aggregator {\n    public static String aggregate() {\n        CompletableFuture<String> a = fetchA();\n        CompletableFuture<String> b = fetchB();\n        return a.thenCombine(b, (x, y) -> x + \"+\" + y).join();\n    }\n\n    static CompletableFuture<String> fetchA() {\n        return CompletableFuture.supplyAsync(() -> { sleep(200); return \"A\"; });\n    }\n\n    static CompletableFuture<String> fetchB() {\n        return CompletableFuture.supplyAsync(() -> { sleep(300); return \"B\"; });\n    }\n\n    static void sleep(long ms) {\n        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }\n    }\n}\n", "modify")]),
            s("Error handling", " exceptionally.", "Map failures to a fallback value with `exceptionally`.", [sn("Aggregator.java", "import java.util.concurrent.CompletableFuture;\n\npublic class Aggregator {\n    public static String aggregateSafe() {\n        return fetchA()\n            .thenCombine(fetchB(), (x, y) -> x + \"+\" + y)\n            .exceptionally(ex -> \"fallback\")\n            .join();\n    }\n\n    static CompletableFuture<String> fetchA() {\n        return CompletableFuture.supplyAsync(() -> { sleep(200); return \"A\"; });\n    }\n\n    static CompletableFuture<String> fetchB() {\n        return CompletableFuture.supplyAsync(() -> { sleep(300); return \"B\"; });\n    }\n\n    static void sleep(long ms) {\n        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }\n    }\n\n    public static void main(String[] args) {\n        System.out.println(aggregateSafe());\n    }\n}\n", "modify")]),
        ],
    ),
    proj(
        "virtual-thread-crawler",
        "java",
        "Virtual Thread URL Crawler",
        "Fetch URLs concurrently with an executor or virtual threads.",
        "advanced",
        "java",
        [
            s("Fetch helper", "HTTP status.", "Use `HttpClient` to GET a URL and return status code.", [sn("Fetcher.java", "import java.net.URI;\nimport java.net.http.HttpClient;\nimport java.net.http.HttpRequest;\nimport java.net.http.HttpResponse;\n\npublic class Fetcher {\n    private final HttpClient client = HttpClient.newHttpClient();\n\n    public int fetchStatus(String url) throws Exception {\n        HttpRequest req = HttpRequest.newBuilder(URI.create(url)).GET().build();\n        HttpResponse<Void> res = client.send(req, HttpResponse.BodyHandlers.discarding());\n        return res.statusCode();\n    }\n}\n", "create")]),
            s("Executor tasks", "Submit per URL.", "Use `ExecutorService` to submit callables for each URL.", [sn("Crawler.java", "import java.util.List;\nimport java.util.concurrent.ExecutorService;\nimport java.util.concurrent.Executors;\nimport java.util.concurrent.Future;\n\npublic class Crawler {\n    public static void main(String[] args) throws Exception {\n        Fetcher fetcher = new Fetcher();\n        List<String> urls = List.of(\"https://httpbin.org/get\", \"https://httpbin.org/delay/1\");\n        try (ExecutorService pool = Executors.newFixedThreadPool(4)) {\n            for (String url : urls) {\n                Future<Integer> f = pool.submit(() -> fetcher.fetchStatus(url));\n                System.out.println(url + \" -> \" + f.get());\n            }\n        }\n    }\n}\n", "create")]),
            s("Virtual threads", "Per-URL thread.", "Replace fixed pool with `Executors.newVirtualThreadPerTaskExecutor()`.", [sn("Crawler.java", "import java.util.List;\nimport java.util.concurrent.ExecutorService;\nimport java.util.concurrent.Executors;\nimport java.util.concurrent.Future;\n\npublic class Crawler {\n    public static void main(String[] args) throws Exception {\n        Fetcher fetcher = new Fetcher();\n        List<String> urls = List.of(\"https://httpbin.org/get\", \"https://httpbin.org/delay/1\");\n        try (ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor()) {\n            List<Future<Integer>> futures = urls.stream()\n                .map(url -> pool.submit(() -> fetcher.fetchStatus(url)))\n                .toList();\n            for (int i = 0; i < urls.size(); i++) {\n                System.out.println(urls.get(i) + \" -> \" + futures.get(i).get());\n            }\n        }\n    }\n}\n", "modify")]),
            s("Timeout handling", "Bounded wait.", "Wrap `get` with a timeout using `orTimeout` on CompletableFuture.", [sn("Crawler.java", "import java.util.List;\nimport java.util.concurrent.*;\n\npublic class Crawler {\n    public static void main(String[] args) {\n        Fetcher fetcher = new Fetcher();\n        List<String> urls = List.of(\"https://httpbin.org/get\", \"https://httpbin.org/delay/2\");\n        try (ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor()) {\n            for (String url : urls) {\n                CompletableFuture<Integer> cf = CompletableFuture.supplyAsync(() -> {\n                    try { return fetcher.fetchStatus(url); } catch (Exception e) { throw new CompletionException(e); }\n                }, pool);\n                try {\n                    System.out.println(url + \" -> \" + cf.orTimeout(3, TimeUnit.SECONDS).join());\n                } catch (CompletionException ex) {\n                    System.out.println(url + \" -> timeout/error\");\n                }\n            }\n        }\n    }\n}\n", "modify")]),
        ],
    ),
    proj(
        "mini-http-rest",
        "java",
        "Mini HTTP REST Server",
        "Expose JSON over `com.sun.net.httpserver.HttpServer`.",
        "intermediate",
        "java",
        [
            s("HttpServer boot", "Server listens.", "Create an `HttpServer` on port 8080 with a root handler.", [sn("App.java", "import com.sun.net.httpserver.HttpServer;\nimport java.io.IOException;\nimport java.net.InetSocketAddress;\n\npublic class App {\n    public static void main(String[] args) throws IOException {\n        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);\n        server.createContext(\"/\", exchange -> {\n            byte[] body = \"ok\".getBytes();\n            exchange.sendResponseHeaders(200, body.length);\n            exchange.getResponseBody().write(body);\n            exchange.close();\n        });\n        server.start();\n        System.out.println(\"listening\");\n    }\n}\n", "create")]),
            s("JSON item model", "Record for items.", "Add an `Item` record and in-memory list.", [sn("Item.java", "public record Item(int id, String name) {}\n", "create"), sn("Store.java", "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Store {\n    private final List<Item> items = new ArrayList<>();\n    private int nextId = 1;\n\n    public Item create(String name) {\n        Item item = new Item(nextId++, name);\n        items.add(item);\n        return item;\n    }\n\n    public List<Item> list() { return List.copyOf(items); }\n}\n", "create")]),
            s("GET /items", "List JSON.", "Register `/items` handler returning JSON array.", [sn("App.java", "import com.sun.net.httpserver.HttpServer;\nimport java.io.IOException;\nimport java.net.InetSocketAddress;\nimport java.nio.charset.StandardCharsets;\n\npublic class App {\n    private static final Store store = new Store();\n\n    public static void main(String[] args) throws IOException {\n        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);\n        server.createContext(\"/items\", exchange -> {\n            if (!\"GET\".equals(exchange.getRequestMethod())) {\n                exchange.sendResponseHeaders(405, -1);\n                return;\n            }\n            String json = store.list().toString();\n            byte[] body = json.getBytes(StandardCharsets.UTF_8);\n            exchange.getResponseHeaders().add(\"Content-Type\", \"application/json\");\n            exchange.sendResponseHeaders(200, body.length);\n            exchange.getResponseBody().write(body);\n            exchange.close();\n        });\n        server.start();\n    }\n}\n", "modify")]),
            s("POST /items", "Create item.", "Parse JSON body on POST and return 201.", [sn("App.java", "import com.sun.net.httpserver.HttpServer;\nimport java.io.IOException;\nimport java.io.InputStream;\nimport java.net.InetSocketAddress;\nimport java.nio.charset.StandardCharsets;\n\npublic class App {\n    private static final Store store = new Store();\n\n    public static void main(String[] args) throws IOException {\n        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);\n        server.createContext(\"/items\", exchange -> {\n            switch (exchange.getRequestMethod()) {\n                case \"GET\" -> writeJson(exchange, 200, store.list().toString());\n                case \"POST\" -> {\n                    String body = new String(readAll(exchange.getRequestBody()), StandardCharsets.UTF_8);\n                    String name = body.replaceAll(\".*\\\"name\\\"\\\\s*:\\\\s*\\\"([^\\\"]+)\\\".*\", \"$1\");\n                    Item created = store.create(name);\n                    writeJson(exchange, 201, created.toString());\n                }\n                default -> exchange.sendResponseHeaders(405, -1);\n            }\n        });\n        server.start();\n    }\n\n    static byte[] readAll(InputStream in) throws IOException { return in.readAllBytes(); }\n\n    static void writeJson(com.sun.net.httpserver.HttpExchange ex, int code, String json) throws IOException {\n        byte[] body = json.getBytes(StandardCharsets.UTF_8);\n        ex.getResponseHeaders().add(\"Content-Type\", \"application/json\");\n        ex.sendResponseHeaders(code, body.length);\n        ex.getResponseBody().write(body);\n        ex.close();\n    }\n}\n", "modify")]),
        ],
    ),
    proj(
        "sealed-expression-eval",
        "java",
        "Sealed Expression Evaluator",
        "Model expressions with sealed types and evaluate to integers.",
        "intermediate",
        "java",
        [
            s("Sealed Expr", "Hierarchy defined.", "Declare sealed `Expr` with `Num` and `Add` permits.", [sn("Expr.java", "public sealed interface Expr permits Num, Add {}\n\nrecord Num(int value) implements Expr {}\n\nrecord Add(Expr left, Expr right) implements Expr {}\n", "create")]),
            s("Evaluator", "Recursive eval.", "Implement `eval(Expr)` with pattern matching.", [sn("Evaluator.java", "public class Evaluator {\n    public static int eval(Expr expr) {\n        return switch (expr) {\n            case Num(int v) -> v;\n            case Add(var l, var r) -> eval(l) + eval(r);\n        };\n    }\n}\n", "create")]),
            s("Build tree", "Sample AST.", "Construct `Add(Num(1), Num(2))` in main.", [sn("Main.java", "public class Main {\n    public static void main(String[] args) {\n        Expr tree = new Add(new Num(1), new Num(2));\n        System.out.println(Evaluator.eval(tree));\n    }\n}\n", "create")]),
            s("Nested add", "Deeper tree.", "Evaluate `(1 + 2) + 3` and print result.", [sn("Main.java", "public class Main {\n    public static void main(String[] args) {\n        Expr tree = new Add(new Add(new Num(1), new Num(2)), new Num(3));\n        System.out.println(Evaluator.eval(tree));\n    }\n}\n", "modify"), sn("Evaluator.java", "public class Evaluator {\n    public static int eval(Expr expr) {\n        return switch (expr) {\n            case Num(int v) -> v;\n            case Add(var l, var r) -> eval(l) + eval(r);\n        };\n    }\n}\n", "modify")]),
        ],
    ),
    proj(
        "producer-consumer-queue",
        "java",
        "Producer Consumer Queue",
        "Coordinate producers and consumers with `BlockingQueue`.",
        "intermediate",
        "java",
        [
            s("Queue setup", "BlockingQueue created.", "Allocate an `ArrayBlockingQueue` with capacity 10.", [sn("Pipeline.java", "import java.util.concurrent.ArrayBlockingQueue;\nimport java.util.concurrent.BlockingQueue;\n\npublic class Pipeline {\n    public static void main(String[] args) {\n        BlockingQueue<String> queue = new ArrayBlockingQueue<>(10);\n        System.out.println(queue.remainingCapacity());\n    }\n}\n", "create")]),
            s("Producer", "Put items.", "Run a producer thread that `put`s work items.", [sn("Pipeline.java", "import java.util.concurrent.ArrayBlockingQueue;\nimport java.util.concurrent.BlockingQueue;\n\npublic class Pipeline {\n    static void producer(BlockingQueue<String> q) throws InterruptedException {\n        for (int i = 1; i <= 5; i++) {\n            q.put(\"job-\" + i);\n            System.out.println(\"produced job-\" + i);\n        }\n    }\n\n    public static void main(String[] args) throws Exception {\n        BlockingQueue<String> queue = new ArrayBlockingQueue<>(10);\n        Thread t = new Thread(() -> { try { producer(queue); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } });\n        t.start();\n        t.join();\n    }\n}\n", "modify")]),
            s("Consumer", "Take items.", "Add a consumer loop with `take`.", [sn("Pipeline.java", "import java.util.concurrent.ArrayBlockingQueue;\nimport java.util.concurrent.BlockingQueue;\n\npublic class Pipeline {\n    static void producer(BlockingQueue<String> q) throws InterruptedException {\n        for (int i = 1; i <= 5; i++) q.put(\"job-\" + i);\n    }\n\n    static void consumer(BlockingQueue<String> q) throws InterruptedException {\n        for (int i = 0; i < 5; i++) {\n            String item = q.take();\n            System.out.println(\"consumed \" + item);\n        }\n    }\n\n    public static void main(String[] args) throws Exception {\n        BlockingQueue<String> queue = new ArrayBlockingQueue<>(10);\n        Thread p = new Thread(() -> run(producer(queue)));\n        Thread c = new Thread(() -> run(consumer(queue)));\n        p.start(); c.start();\n        p.join(); c.join();\n    }\n\n    static void run(ThrowableRunnable r) { try { r.run(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } }\n    @FunctionalInterface interface ThrowableRunnable { void run() throws InterruptedException; }\n}\n", "modify")]),
            s("Poison pill", "Graceful stop.", "Send a sentinel value to stop the consumer.", [sn("Pipeline.java", "import java.util.concurrent.ArrayBlockingQueue;\nimport java.util.concurrent.BlockingQueue;\n\npublic class Pipeline {\n    static final String POISON = \"__STOP__\";\n\n    static void producer(BlockingQueue<String> q) throws InterruptedException {\n        for (int i = 1; i <= 3; i++) q.put(\"job-\" + i);\n        q.put(POISON);\n    }\n\n    static void consumer(BlockingQueue<String> q) throws InterruptedException {\n        while (true) {\n            String item = q.take();\n            if (POISON.equals(item)) break;\n            System.out.println(\"consumed \" + item);\n        }\n    }\n\n    public static void main(String[] args) throws Exception {\n        BlockingQueue<String> queue = new ArrayBlockingQueue<>(10);\n        Thread p = new Thread(() -> run(() -> producer(queue)));\n        Thread c = new Thread(() -> run(() -> consumer(queue)));\n        p.start(); c.start();\n        p.join(); c.join();\n    }\n\n    static void run(ThrowableRunnable r) { try { r.run(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } }\n    @FunctionalInterface interface ThrowableRunnable { void run() throws InterruptedException; }\n}\n", "modify")]),
        ],
    ),
]

KOTLIN = [
    proj(
        "contact-book",
        "kotlin",
        "Contact Book",
        "Manage contacts with a Kotlin data class and mutable list.",
        "beginner",
        "kotlin",
        [
            s("Contact data class", "Model defined.", "Create `data class Contact(val id: Int, val name: String, val phone: String)`.", [sn("Contact.kt", "data class Contact(val id: Int, val name: String, val phone: String)\n", "create")]),
            s("Book store", "Mutable list.", "Wrap contacts in a `ContactBook` with add and find.", [sn("ContactBook.kt", "class ContactBook {\n    private val contacts = mutableListOf<Contact>()\n    private var nextId = 1\n\n    fun add(name: String, phone: String): Contact {\n        val c = Contact(nextId++, name, phone)\n        contacts.add(c)\n        return c\n    }\n\n    fun all(): List<Contact> = contacts.toList()\n}\n", "create")]),
            s("Find by name", "Lookup helper.", "Add `findByName` returning nullable contact.", [sn("ContactBook.kt", "class ContactBook {\n    private val contacts = mutableListOf<Contact>()\n    private var nextId = 1\n\n    fun add(name: String, phone: String): Contact {\n        val c = Contact(nextId++, name, phone)\n        contacts.add(c)\n        return c\n    }\n\n    fun findByName(name: String): Contact? = contacts.firstOrNull { it.name.equals(name, ignoreCase = true) }\n\n    fun all(): List<Contact> = contacts.toList()\n}\n", "modify")]),
            s("Main demo", "Print contacts.", "Use `main` to add and list contacts.", [sn("Main.kt", "fun main() {\n    val book = ContactBook()\n    book.add(\"Ada\", \"555-0100\")\n    book.add(\"Bob\", \"555-0101\")\n    book.all().forEach { println(it) }\n    println(book.findByName(\"ada\"))\n}\n", "create")]),
        ],
    ),
    proj(
        "sealed-result-api",
        "kotlin",
        "Sealed Result API",
        "Model API outcomes with a sealed `Result` hierarchy.",
        "intermediate",
        "kotlin",
        [
            s("Sealed Result", "Success and Error.", "Define `sealed class Result<out T>` with data subclasses.", [sn("Result.kt", "sealed class Result<out T> {\n    data class Success<T>(val value: T) : Result<T>()\n    data class Error(val message: String) : Result<Nothing>()\n}\n", "create")]),
            s("Safe divide", "Returning Result.", "Implement `divide` returning Success or Error.", [sn("Math.kt", "fun divide(a: Int, b: Int): Result<Int> {\n    if (b == 0) return Result.Error(\"divide by zero\")\n    return Result.Success(a / b)\n}\n", "create")]),
            s("Map helper", "Transform success.", "Add extension `map` on Result.", [sn("Result.kt", "sealed class Result<out T> {\n    data class Success<T>(val value: T) : Result<T>()\n    data class Error(val message: String) : Result<Nothing>()\n}\n\ninline fun <T, R> Result<T>.map(transform: (T) -> R): Result<R> = when (this) {\n    is Result.Success -> Result.Success(transform(value))\n    is Result.Error -> this\n}\n", "modify")]),
            s("When handling", "Exhaustive branch.", "Use `when` in main to print outcomes.", [sn("Main.kt", "fun main() {\n    val r = divide(10, 2).map { it * 2 }\n    when (r) {\n        is Result.Success -> println(\"ok ${r.value}\")\n        is Result.Error -> println(\"err ${r.message}\")\n    }\n}\n", "create")]),
        ],
    ),
    proj(
        "coroutine-news-fetcher",
        "kotlin",
        "Coroutine News Fetcher",
        "Fetch headlines concurrently with coroutines.",
        "intermediate",
        "kotlin",
        [
            s("Suspend fetch", "Fake network.", "Add `suspend fun fetchHeadline(id: Int)` with `delay`.", [sn("News.kt", "import kotlinx.coroutines.delay\n\nsuspend fun fetchHeadline(id: Int): String {\n    delay(300)\n    return \"Headline-$id\"\n}\n", "create")]),
            s("Sequential run", "runBlocking.", "Call fetches one by one in `main`.", [sn("Main.kt", "import kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    val a = fetchHeadline(1)\n    val b = fetchHeadline(2)\n    println(a)\n    println(b)\n}\n", "create")]),
            s("Async parallel", "async/await.", "Launch two `async` jobs and await both.", [sn("Main.kt", "import kotlinx.coroutines.async\nimport kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    val d1 = async { fetchHeadline(1) }\n    val d2 = async { fetchHeadline(2) }\n    println(d1.await())\n    println(d2.await())\n}\n", "modify")]),
            s("Launch many", "Structured concurrency.", "Use `coroutineScope` to fetch a list of ids.", [sn("Main.kt", "import kotlinx.coroutines.async\nimport kotlinx.coroutines.coroutineScope\nimport kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    val ids = listOf(1, 2, 3)\n    val headlines = coroutineScope {\n        ids.map { id -> async { fetchHeadline(id) } }.map { it.await() }\n    }\n    headlines.forEach { println(it) }\n}\n", "modify")]),
        ],
    ),
    proj(
        "flow-ticker",
        "kotlin",
        "Flow Ticker",
        "Emit periodic ticks with Kotlin Flow.",
        "intermediate",
        "kotlin",
        [
            s("Flow builder", "tick flow.", "Create `tickerFlow(intervalMs)` using `flow` builder.", [sn("Ticker.kt", "import kotlinx.coroutines.delay\nimport kotlinx.coroutines.flow.flow\n\nfun tickerFlow(intervalMs: Long) = flow {\n    var n = 0\n    while (true) {\n        emit(n++)\n        delay(intervalMs)\n    }\n}\n", "create")]),
            s("Collect ticks", "take operator.", "Collect first 5 emissions in `main`.", [sn("Main.kt", "import kotlinx.coroutines.flow.take\nimport kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    tickerFlow(100).take(5).collect { println(\"tick $it\") }\n}\n", "create")]),
            s("Map ticks", "Transform values.", "Map ticks to formatted strings before collect.", [sn("Main.kt", "import kotlinx.coroutines.flow.map\nimport kotlinx.coroutines.flow.take\nimport kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    tickerFlow(50)\n        .take(5)\n        .map { \"tick-$it\" }\n        .collect { println(it) }\n}\n", "modify")]),
            s("Cancel on timeout", "withTimeout.", "Stop collection after 400ms with `withTimeout`.", [sn("Main.kt", "import kotlinx.coroutines.flow.map\nimport kotlinx.coroutines.runBlocking\nimport kotlinx.coroutines.withTimeout\n\nfun main() = runBlocking {\n    withTimeout(400) {\n        tickerFlow(100).map { \"tick-$it\" }.collect { println(it) }\n    }\n}\n", "modify")]),
        ],
    ),
    proj(
        "ktor-style-routes",
        "kotlin",
        "Ktor-Style Routes (Manual)",
        "Simulate HTTP routing with a map of path handlers — no Ktor dependency.",
        "intermediate",
        "kotlin",
        [
            s("Request/Response", "Simple types.", "Define `Request` and `Response` data classes.", [sn("Http.kt", "data class Request(val method: String, val path: String)\ndata class Response(val status: Int, val body: String)\n", "create")]),
            s("Router map", "Register routes.", "Build `Router` with `get` and `post` helpers storing lambdas.", [sn("Router.kt", "typealias Handler = (Request) -> Response\n\nclass Router {\n    private val routes = mutableMapOf<Pair<String, String>, Handler>()\n\n    fun get(path: String, handler: Handler) { routes[\"GET\" to path] = handler }\n    fun post(path: String, handler: Handler) { routes[\"POST\" to path] = handler }\n\n    fun handle(req: Request): Response {\n        val handler = routes[req.method to req.path]\n        return handler?.invoke(req) ?: Response(404, \"not found\")\n    }\n}\n", "create")]),
            s("Article routes", "CRUD stubs.", "Register `/articles` GET and POST handlers.", [sn("Main.kt", "fun main() {\n    val router = Router()\n    val articles = mutableListOf<String>()\n\n    router.get(\"/articles\") { Response(200, articles.joinToString(\",\")) }\n    router.post(\"/articles\") {\n        articles.add(\"item-${articles.size + 1}\")\n        Response(201, \"created\")\n    }\n\n    println(router.handle(Request(\"GET\", \"/articles\")))\n    println(router.handle(Request(\"POST\", \"/articles\")))\n    println(router.handle(Request(\"GET\", \"/articles\")))\n}\n", "create")]),
            s("Path params", "Extract id.", "Parse `/articles/{id}` style paths manually.", [sn("Router.kt", "typealias Handler = (Request) -> Response\n\nclass Router {\n    private val routes = mutableMapOf<Pair<String, String>, Handler>()\n\n    fun get(path: String, handler: Handler) { routes[\"GET\" to path] = handler }\n\n    fun handle(req: Request): Response {\n        routes[req.method to req.path]?.let { return it(req) }\n        if (req.method == \"GET\" && req.path.startsWith(\"/articles/\")) {\n            val id = req.path.removePrefix(\"/articles/\")\n            return Response(200, \"article-$id\")\n        }\n        return Response(404, \"not found\")\n    }\n}\n", "modify")]),
        ],
    ),
    proj(
        "channel-pipeline",
        "kotlin",
        "Channel Pipeline",
        "Move work through a Channel from producer to consumer.",
        "intermediate",
        "kotlin",
        [
            s("Channel create", "Buffered channel.", "Open a `Channel<String>` with capacity 5.", [sn("Pipeline.kt", "import kotlinx.coroutines.channels.Channel\nimport kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    val ch = Channel<String>(5)\n    ch.close()\n}\n", "create")]),
            s("Producer coroutine", "Send items.", "Launch a producer that sends 5 messages.", [sn("Pipeline.kt", "import kotlinx.coroutines.channels.Channel\nimport kotlinx.coroutines.launch\nimport kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    val ch = Channel<String>(5)\n    launch {\n        repeat(5) { i -> ch.send(\"msg-$i\") }\n        ch.close()\n    }\n}\n", "modify")]),
            s("Consumer loop", "Receive until closed.", "Consume with `for (msg in ch)`.", [sn("Pipeline.kt", "import kotlinx.coroutines.channels.Channel\nimport kotlinx.coroutines.launch\nimport kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    val ch = Channel<String>(5)\n    launch {\n        repeat(5) { i -> ch.send(\"msg-$i\") }\n        ch.close()\n    }\n    launch {\n        for (msg in ch) println(\"got $msg\")\n    }\n}\n", "modify")]),
            s("Pipeline stages", "Map in middle.", "Add a middle coroutine that uppercases messages.", [sn("Pipeline.kt", "import kotlinx.coroutines.channels.Channel\nimport kotlinx.coroutines.launch\nimport kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    val raw = Channel<String>(5)\n    val processed = Channel<String>(5)\n\n    launch {\n        repeat(3) { i -> raw.send(\"msg-$i\") }\n        raw.close()\n    }\n    launch {\n        for (msg in raw) processed.send(msg.uppercase())\n        processed.close()\n    }\n    launch {\n        for (msg in processed) println(msg)\n    }\n}\n", "modify")]),
        ],
    ),
    proj(
        "dsl-query-builder",
        "kotlin",
        "DSL Query Builder",
        "Build SQL-like queries with a type-safe Kotlin DSL.",
        "intermediate",
        "kotlin",
        [
            s("Query model", "Data classes.", "Define `Query` with table, columns, and where clause.", [sn("Query.kt", "data class Query(\n    val table: String,\n    val columns: List<String> = listOf(\"*\"),\n    val where: String? = null,\n)\n", "create")]),
            s("Builder class", "Fluent API.", "Add `QueryBuilder` with `select`, `from`, `where`.", [sn("QueryBuilder.kt", "class QueryBuilder {\n    private var table: String = \"\"\n    private val columns = mutableListOf<String>()\n    private var where: String? = null\n\n    fun select(vararg cols: String) = apply { columns.addAll(cols) }\n    fun from(t: String) = apply { table = t }\n    fun where(clause: String) = apply { where = clause }\n\n    fun build(): Query = Query(table, columns.ifEmpty { listOf(\"*\") }, where)\n}\n", "create")]),
            s("Lambda DSL", "Receiver function.", "Add `query { }` top-level with `@DslMarker`.", [sn("QueryDsl.kt", "@DslMarker\nannotation class QueryDsl\n\n@QueryDsl\nclass QueryDslBuilder {\n    private val inner = QueryBuilder()\n    fun select(vararg cols: String) = inner.select(*cols)\n    fun from(table: String) = inner.from(table)\n    fun where(clause: String) = inner.where(clause)\n    fun build() = inner.build()\n}\n\nfun query(block: QueryDslBuilder.() -> Unit): Query {\n    val b = QueryDslBuilder()\n    b.block()\n    return b.build()\n}\n", "create")]),
            s("Render SQL", "toSql extension.", "Print SQL string from built query.", [sn("Main.kt", "fun Query.toSql(): String {\n    val cols = columns.joinToString(\", \")\n    val base = \"SELECT $cols FROM $table\"\n    return if (where != null) \"$base WHERE $where\" else base\n}\n\nfun main() {\n    val q = query {\n        select(\"id\", \"name\")\n        from(\"users\")\n        where(\"active = 1\")\n    }\n    println(q.toSql())\n}\n", "create")]),
        ],
    ),
    proj(
        "coroutine-rate-limiter",
        "kotlin",
        "Coroutine Rate Limiter",
        "Throttle requests with delay and a semaphore-style permit bucket.",
        "intermediate",
        "kotlin",
        [
            s("RateLimiter class", "Permit counter.", "Track available permits and refill delay.", [sn("RateLimiter.kt", "import kotlinx.coroutines.delay\nimport kotlinx.coroutines.sync.Mutex\nimport kotlinx.coroutines.sync.withLock\n\nclass RateLimiter(private val maxPermits: Int, private val refillMs: Long) {\n    private var permits = maxPermits\n    private val mutex = Mutex()\n\n    suspend fun acquire() = mutex.withLock {\n        while (permits == 0) {\n            mutex.unlock()\n            delay(refillMs)\n            mutex.lock()\n            permits = maxPermits\n        }\n        permits--\n    }\n}\n", "create")]),
            s("Acquire before work", "Guarded call.", "Wrap fake API call with `acquire()`.", [sn("Api.kt", "import kotlinx.coroutines.delay\n\nsuspend fun callApi(id: Int): String {\n    delay(100)\n    return \"response-$id\"\n}\n", "create"), sn("Main.kt", "import kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    val limiter = RateLimiter(maxPermits = 2, refillMs = 500)\n    repeat(4) { id ->\n        limiter.acquire()\n        println(callApi(id))\n    }\n}\n", "create")]),
            s("Semaphore version", " kotlinx Semaphore.", "Alternate implementation using `Semaphore`.", [sn("RateLimiter.kt", "import kotlinx.coroutines.sync.Semaphore\nimport kotlinx.coroutines.sync.withPermit\n\nclass RateLimiter(private val maxPermits: Int) {\n    private val sem = Semaphore(maxPermits)\n\n    suspend fun <T> withLimit(block: suspend () -> T): T = sem.withPermit { block() }\n}\n", "modify")]),
            s("Parallel jobs", "Limited launch.", "Launch 6 jobs but only 2 run at once.", [sn("Main.kt", "import kotlinx.coroutines.async\nimport kotlinx.coroutines.awaitAll\nimport kotlinx.coroutines.runBlocking\n\nfun main() = runBlocking {\n    val limiter = RateLimiter(2)\n    val jobs = (1..6).map { id ->\n        async {\n            limiter.withLimit {\n                println(\"start $id\")\n                callApi(id)\n            }\n        }\n    }\n    jobs.awaitAll().forEach { println(it) }\n}\n", "modify")]),
        ],
    ),
]

# async-fetcher: 4 steps from apps/api/seed/data/projects.json
ASYNC_FETCHER_STEPS = [
    s(
        "Synchronous baseline",
        "Fetch two URLs sequentially with httpx in a plain script.",
        "Start with the simplest version: a `main()` that calls a blocking `fetch` twice. This is the baseline we will make concurrent.",
        [sn("main.py", "import httpx\n\nURLS = [\n    \"https://httpbin.org/get\",\n    \"https://httpbin.org/delay/1\",\n]\n\n\ndef fetch(client: httpx.Client, url: str) -> int:\n    response = client.get(url, timeout=10.0)\n    response.raise_for_status()\n    return response.status_code\n\n\ndef main() -> None:\n    with httpx.Client() as client:\n        for url in URLS:\n            status = fetch(client, url)\n            print(url, status)\n\n\nif __name__ == \"__main__\":\n    main()\n", "create", "Blocking fetch script")],
    ),
    s(
        "Async fetch coroutine",
        "Replace blocking calls with `async def` and `AsyncClient`.",
        "Convert `fetch` to a coroutine using `httpx.AsyncClient`. Drive the event loop with `asyncio.run(main())`.\n\nStill fetch URLs one after another — concurrency comes next.",
        [sn("main.py", "import asyncio\nimport httpx\n\nURLS = [\n    \"https://httpbin.org/get\",\n    \"https://httpbin.org/delay/1\",\n]\n\n\nasync def fetch(client: httpx.AsyncClient, url: str) -> int:\n    response = await client.get(url, timeout=10.0)\n    response.raise_for_status()\n    return response.status_code\n\n\nasync def main() -> None:\n    async with httpx.AsyncClient() as client:\n        for url in URLS:\n            status = await fetch(client, url)\n            print(url, status)\n\n\nif __name__ == \"__main__\":\n    asyncio.run(main())\n", "modify", "Async main and fetch")],
    ),
    s(
        "Concurrent gather",
        "Run all fetches concurrently with `asyncio.gather`.",
        "Build a list of coroutines and pass them to `asyncio.gather`. Total time should be close to the **slowest** URL, not the sum.",
        [sn("main.py", "import asyncio\nimport httpx\n\nURLS = [\n    \"https://httpbin.org/get\",\n    \"https://httpbin.org/delay/1\",\n]\n\n\nasync def fetch(client: httpx.AsyncClient, url: str) -> int:\n    response = await client.get(url, timeout=10.0)\n    response.raise_for_status()\n    return response.status_code\n\n\nasync def main() -> None:\n    async with httpx.AsyncClient() as client:\n        tasks = [fetch(client, url) for url in URLS]\n        statuses = await asyncio.gather(*tasks)\n        for url, status in zip(URLS, statuses):\n            print(url, status)\n\n\nif __name__ == \"__main__\":\n    asyncio.run(main())\n", "modify", "Gather all tasks")],
    ),
    s(
        "Split files and bound concurrency",
        "Extract fetch logic to `fetcher.py` and cap in-flight requests from `main.py`.",
        "Larger apps split responsibilities across files. Move the fetch helper to **`fetcher.py`**, keep orchestration in **`main.py`**, and use `asyncio.Semaphore` in main to limit concurrency — the same idea as a worker pool.\n\nCreate both files in the same directory and run `python main.py`.",
        [
            sn("fetcher.py", "import httpx\n\n\nasync def fetch(client: httpx.AsyncClient, url: str) -> int:\n    response = await client.get(url, timeout=10.0)\n    response.raise_for_status()\n    return response.status_code\n", "create", "New file — fetch helper"),
            sn(
                "main.py",
                "import asyncio\nimport httpx\n\nfrom fetcher import fetch\n\nURLS = [\n    \"https://httpbin.org/get\",\n    \"https://httpbin.org/delay/1\",\n    \"https://httpbin.org/delay/1\",\n    \"https://httpbin.org/get\",\n]\n\nMAX_CONCURRENT = 2\n\n\nasync def fetch_bounded(\n    client: httpx.AsyncClient, sem: asyncio.Semaphore, url: str\n) -> int:\n    async with sem:\n        print(\"fetching\", url)\n        return await fetch(client, url)\n\n\nasync def main() -> None:\n    sem = asyncio.Semaphore(MAX_CONCURRENT)\n    async with httpx.AsyncClient() as client:\n        tasks = [fetch_bounded(client, sem, url) for url in URLS]\n        statuses = await asyncio.gather(*tasks)\n        for url, status in zip(URLS, statuses):\n            print(url, status)\n\n\nif __name__ == \"__main__\":\n    asyncio.run(main())\n",
                "modify",
                "Wire semaphore in main",
            ),
        ],
    ),
]

PYTHON = [
    proj(
        "async-fetcher",
        "python",
        "Async URL Fetcher",
        "Build a minimal concurrent URL fetcher using asyncio — from a sync script to gathered tasks, then split across files.",
        "intermediate",
        "python",
        ASYNC_FETCHER_STEPS,
        "https://www.online-python.com/",
    ),
    proj(
        "fastapi-crud-layout",
        "python",
        "FastAPI CRUD Layout",
        "Structure a FastAPI app with routers, schemas, and an in-memory article store.",
        "intermediate",
        "python",
        [
            s("App entry", "FastAPI instance.", "Create `app/main.py` with a health route.", [sn("app/main.py", "from fastapi import FastAPI\n\napp = FastAPI(title=\"Articles API\")\n\n\n@app.get(\"/health\")\ndef health():\n    return {\"status\": \"ok\"}\n", "create")]),
            s("Schemas", "Pydantic models.", "Add `ArticleCreate` and `ArticleOut` in `app/schemas.py`.", [sn("app/schemas.py", "from pydantic import BaseModel\n\n\nclass ArticleCreate(BaseModel):\n    title: str\n    body: str\n\n\nclass ArticleOut(ArticleCreate):\n    id: int\n", "create")]),
            s("Router", "List and create.", "Implement GET/POST `/articles` in `app/routers/articles.py`.", [sn("app/routers/articles.py", "from fastapi import APIRouter\nfrom app.schemas import ArticleCreate, ArticleOut\n\nrouter = APIRouter(prefix=\"/articles\", tags=[\"articles\"])\n_store: list[ArticleOut] = []\n_next_id = 1\n\n\n@router.get(\"\", response_model=list[ArticleOut])\ndef list_articles():\n    return _store\n\n\n@router.post(\"\", response_model=ArticleOut, status_code=201)\ndef create_article(payload: ArticleCreate):\n    global _next_id\n    item = ArticleOut(id=_next_id, **payload.model_dump())\n    _next_id += 1\n    _store.append(item)\n    return item\n", "create")]),
            s("Wire router", "Include in app.", "Register the articles router from `main.py`.", [sn("app/main.py", "from fastapi import FastAPI\nfrom app.routers.articles import router as articles_router\n\napp = FastAPI(title=\"Articles API\")\napp.include_router(articles_router)\n\n\n@app.get(\"/health\")\ndef health():\n    return {\"status\": \"ok\"}\n", "modify"), sn("app/__init__.py", "", "create")]),
        ],
    ),
    proj(
        "argparse-cli",
        "python",
        "Argparse Greet CLI",
        "Build a small CLI with `argparse` for greeting users.",
        "beginner",
        "python",
        [
            s("Basic main", "Script runs.", "Create `main.py` that prints hello.", [sn("main.py", "def main() -> None:\n    print(\"hello\")\n\n\nif __name__ == \"__main__\":\n    main()\n", "create")]),
            s("Argparse name", "Required --name.", "Parse `--name` with argparse.", [sn("main.py", "import argparse\n\n\ndef main() -> None:\n    parser = argparse.ArgumentParser(description=\"Greet CLI\")\n    parser.add_argument(\"--name\", required=True, help=\"person to greet\")\n    args = parser.parse_args()\n    print(f\"Hello, {args.name}!\")\n\n\nif __name__ == \"__main__\":\n    main()\n", "modify")]),
            s("Optional count", "Repeat greeting.", "Add `--count` defaulting to 1.", [sn("main.py", "import argparse\n\n\ndef main() -> None:\n    parser = argparse.ArgumentParser(description=\"Greet CLI\")\n    parser.add_argument(\"--name\", required=True)\n    parser.add_argument(\"--count\", type=int, default=1)\n    args = parser.parse_args()\n    for _ in range(args.count):\n        print(f\"Hello, {args.name}!\")\n\n\nif __name__ == \"__main__\":\n    main()\n", "modify")]),
            s("Uppercase flag", "Style toggle.", "Add `--shout` to uppercase the greeting.", [sn("main.py", "import argparse\n\n\ndef greet(name: str, shout: bool) -> str:\n    msg = f\"Hello, {name}!\"\n    return msg.upper() if shout else msg\n\n\ndef main() -> None:\n    parser = argparse.ArgumentParser(description=\"Greet CLI\")\n    parser.add_argument(\"--name\", required=True)\n    parser.add_argument(\"--count\", type=int, default=1)\n    parser.add_argument(\"--shout\", action=\"store_true\")\n    args = parser.parse_args()\n    for _ in range(args.count):\n        print(greet(args.name, args.shout))\n\n\nif __name__ == \"__main__\":\n    main()\n", "modify")]),
        ],
    ),
    proj(
        "dataclass-domain",
        "python",
        "Dataclass Order Domain",
        "Model orders with dataclasses and simple validation.",
        "beginner",
        "python",
        [
            s("Order dataclass", "Fields defined.", "Create `Order` with id, sku, and quantity.", [sn("order.py", "from dataclasses import dataclass\n\n\n@dataclass\nclass Order:\n    id: int\n    sku: str\n    quantity: int\n", "create")]),
            s("Validation", "Post-init checks.", "Reject non-positive quantity in `__post_init__`.", [sn("order.py", "from dataclasses import dataclass\n\n\n@dataclass\nclass Order:\n    id: int\n    sku: str\n    quantity: int\n\n    def __post_init__(self) -> None:\n        if self.quantity <= 0:\n            raise ValueError(\"quantity must be positive\")\n        if not self.sku:\n            raise ValueError(\"sku required\")\n", "modify")]),
            s("Total price", "Computed property.", "Add `line_total` using a unit price argument.", [sn("order.py", "from dataclasses import dataclass\n\n\n@dataclass\nclass Order:\n    id: int\n    sku: str\n    quantity: int\n    unit_price: float\n\n    def __post_init__(self) -> None:\n        if self.quantity <= 0:\n            raise ValueError(\"quantity must be positive\")\n\n    @property\n    def line_total(self) -> float:\n        return self.quantity * self.unit_price\n", "modify")]),
            s("Demo main", "Create orders.", "Instantiate orders and print totals in `main.py`.", [sn("main.py", "from order import Order\n\n\ndef main() -> None:\n    orders = [\n        Order(1, \"BOOK-1\", 2, 9.99),\n        Order(2, \"PEN-3\", 5, 1.50),\n    ]\n    for o in orders:\n        print(o.sku, o.line_total)\n\n\nif __name__ == \"__main__\":\n    main()\n", "create")]),
        ],
    ),
    proj(
        "decorator-retry",
        "python",
        "Retry Decorator",
        "Wrap flaky functions with a retry decorator.",
        "intermediate",
        "python",
        [
            s("Flaky function", "Random failure.", "Implement `unstable()` that fails sometimes.", [sn("flaky.py", "import random\n\n\ndef unstable() -> str:\n    if random.random() < 0.7:\n        raise RuntimeError(\"temporary failure\")\n    return \"ok\"\n", "create")]),
            s("Retry decorator", "Attempts loop.", "Create `retry(times, delay)` decorator.", [sn("retry.py", "import time\nfrom functools import wraps\nfrom typing import Callable, TypeVar\n\nT = TypeVar(\"T\")\n\n\ndef retry(times: int = 3, delay: float = 0.1) -> Callable[[Callable[..., T]], Callable[..., T]]:\n    def decorator(fn: Callable[..., T]) -> Callable[..., T]:\n        @wraps(fn)\n        def wrapper(*args, **kwargs) -> T:\n            last: Exception | None = None\n            for attempt in range(1, times + 1):\n                try:\n                    return fn(*args, **kwargs)\n                except Exception as exc:\n                    last = exc\n                    time.sleep(delay)\n            raise last  # type: ignore[misc]\n        return wrapper\n    return decorator\n", "create")]),
            s("Apply decorator", "Stable call.", "Decorate `unstable` and call from main.", [sn("main.py", "from flaky import unstable\nfrom retry import retry\n\n\n@retry(times=5, delay=0.05)\ndef stable_unstable() -> str:\n    return unstable()\n\n\ndef main() -> None:\n    print(stable_unstable())\n\n\nif __name__ == \"__main__\":\n    main()\n", "create")]),
            s("Logging attempts", "Observe retries.", "Print attempt number before re-raising.", [sn("retry.py", "import time\nfrom functools import wraps\nfrom typing import Callable, TypeVar\n\nT = TypeVar(\"T\")\n\n\ndef retry(times: int = 3, delay: float = 0.1) -> Callable[[Callable[..., T]], Callable[..., T]]:\n    def decorator(fn: Callable[..., T]) -> Callable[..., T]:\n        @wraps(fn)\n        def wrapper(*args, **kwargs) -> T:\n            last: Exception | None = None\n            for attempt in range(1, times + 1):\n                try:\n                    return fn(*args, **kwargs)\n                except Exception as exc:\n                    last = exc\n                    print(f\"retry {attempt}/{times} after {exc}\")\n                    time.sleep(delay)\n            raise last  # type: ignore[misc]\n        return wrapper\n    return decorator\n", "modify")]),
        ],
    ),
    proj(
        "asyncio-task-queue",
        "python",
        "Asyncio Task Queue",
        "Process jobs with asyncio workers backed by a Queue.",
        "intermediate",
        "python",
        [
            s("Queue setup", "Async queue.", "Create `asyncio.Queue` and enqueue sample jobs.", [sn("main.py", "import asyncio\n\n\nasync def main() -> None:\n    q: asyncio.Queue[str] = asyncio.Queue()\n    for i in range(3):\n        await q.put(f\"job-{i}\")\n    print(\"queued\", q.qsize())\n\n\nif __name__ == \"__main__\":\n    asyncio.run(main())\n", "create")]),
            s("Worker coroutine", "Consume jobs.", "Implement `worker` that processes until sentinel.", [sn("main.py", "import asyncio\n\nSTOP = None\n\n\nasync def worker(name: str, q: asyncio.Queue) -> None:\n    while True:\n        job = await q.get()\n        if job is STOP:\n            q.task_done()\n            break\n        print(name, \"processing\", job)\n        await asyncio.sleep(0.1)\n        q.task_done()\n", "modify")]),
            s("Start workers", "Multiple consumers.", "Spawn two workers and wait on `queue.join()`.", [sn("main.py", "import asyncio\n\nSTOP = None\n\n\nasync def worker(name: str, q: asyncio.Queue) -> None:\n    while True:\n        job = await q.get()\n        if job is STOP:\n            q.task_done()\n            break\n        print(name, \"processing\", job)\n        await asyncio.sleep(0.1)\n        q.task_done()\n\n\nasync def main() -> None:\n    q: asyncio.Queue = asyncio.Queue()\n    workers = [asyncio.create_task(worker(f\"w{i}\", q)) for i in range(2)]\n    for i in range(5):\n        await q.put(f\"job-{i}\")\n    for _ in workers:\n        await q.put(STOP)\n    await q.join()\n    await asyncio.gather(*workers)\n\n\nif __name__ == \"__main__\":\n    asyncio.run(main())\n", "modify")]),
            s("Producer task", "Enqueue concurrently.", "Add a producer coroutine that feeds the queue.", [sn("main.py", "import asyncio\n\nSTOP = None\n\n\nasync def producer(q: asyncio.Queue) -> None:\n    for i in range(5):\n        await q.put(f\"job-{i}\")\n    for _ in range(2):\n        await q.put(STOP)\n\n\nasync def worker(name: str, q: asyncio.Queue) -> None:\n    while True:\n        job = await q.get()\n        if job is STOP:\n            q.task_done()\n            break\n        print(name, job)\n        q.task_done()\n\n\nasync def main() -> None:\n    q: asyncio.Queue = asyncio.Queue()\n    workers = [asyncio.create_task(worker(f\"w{i}\", q)) for i in range(2)]\n    await asyncio.gather(producer(q), *workers)\n    await q.join()\n\n\nif __name__ == \"__main__\":\n    asyncio.run(main())\n", "modify")]),
        ],
    ),
    proj(
        "mini-redis-parser",
        "python",
        "Mini Redis Parser",
        "Parse simple Redis-style commands: PING, SET, GET.",
        "intermediate",
        "python",
        [
            s("Tokenize input", "Split words.", "Parse a command line into tokens.", [sn("parser.py", "def tokenize(line: str) -> list[str]:\n    return line.strip().split()\n", "create")]),
            s("Command enum", "Known verbs.", "Map tokens to command name and args.", [sn("parser.py", "from dataclasses import dataclass\n\n\ndef tokenize(line: str) -> list[str]:\n    return line.strip().split()\n\n\n@dataclass\nclass Command:\n    name: str\n    args: list[str]\n\n\ndef parse(line: str) -> Command:\n    parts = tokenize(line)\n    if not parts:\n        raise ValueError(\"empty command\")\n    return Command(parts[0].upper(), parts[1:])\n", "modify")]),
            s("In-memory store", "SET/GET.", "Implement a dict-backed store in `server.py`.", [sn("server.py", "from parser import Command, parse\n\n_store: dict[str, str] = {}\n\n\ndef execute(cmd: Command) -> str:\n    if cmd.name == \"PING\":\n        return \"PONG\"\n    if cmd.name == \"SET\":\n        key, value = cmd.args\n        _store[key] = value\n        return \"OK\"\n    if cmd.name == \"GET\":\n        key = cmd.args[0]\n        return _store.get(key, \"\")\n    raise ValueError(f\"unknown {cmd.name}\")\n\n\ndef handle_line(line: str) -> str:\n    return execute(parse(line))\n", "create")]),
            s("REPL loop", "Interactive shell.", "Read lines in `main.py` until quit.", [sn("main.py", "from server import handle_line\n\n\ndef main() -> None:\n    print(\"mini-redis. commands: PING, SET k v, GET k, QUIT\")\n    while True:\n        line = input(\"> \").strip()\n        if line.upper() == \"QUIT\":\n            break\n        try:\n            print(handle_line(line))\n        except Exception as exc:\n            print(\"ERR\", exc)\n\n\nif __name__ == \"__main__\":\n    main()\n", "create")]),
        ],
    ),
    proj(
        "app-package-tree",
        "python",
        "App Package Tree",
        "Organize a small Python app like DevLearn with main, routers, and services.",
        "intermediate",
        "python",
        [
            s("Package layout", "app package.", "Create `app/main.py` and empty `app/__init__.py`.", [sn("app/__init__.py", "", "create"), sn("app/main.py", "from app.routers.health import health_router\n\n\ndef create_app():\n    routes = [health_router]\n    return routes\n\n\ndef main() -> None:\n    print(\"routes\", [r.path for r in create_app()])\n\n\nif __name__ == \"__main__\":\n    main()\n", "create")]),
            s("Health router", "Route object.", "Define a simple `Route` dataclass and `/health`.", [sn("app/routers/health.py", "from dataclasses import dataclass\nfrom typing import Callable\n\n\n@dataclass\nclass Route:\n    method: str\n    path: str\n    handler: Callable[[], dict]\n\n\ndef health() -> dict:\n    return {\"status\": \"ok\"}\n\n\nhealth_router = Route(\"GET\", \"/health\", health)\n", "create")]),
            s("Stats service", "Business logic.", "Add `app/services/stats.py` with visit counter.", [sn("app/services/stats.py", "class StatsService:\n    def __init__(self) -> None:\n        self.visits = 0\n\n    def record_visit(self) -> int:\n        self.visits += 1\n        return self.visits\n\n    def snapshot(self) -> dict:\n        return {\"visits\": self.visits}\n", "create")]),
            s("Stats route", "Wire service.", "Expose `/stats` using the stats service.", [sn("app/routers/health.py", "from dataclasses import dataclass\nfrom typing import Callable\n\nfrom app.services.stats import StatsService\n\n_stats = StatsService()\n\n\n@dataclass\nclass Route:\n    method: str\n    path: str\n    handler: Callable[[], dict]\n\n\ndef health() -> dict:\n    return {\"status\": \"ok\"}\n\n\ndef stats() -> dict:\n    _stats.record_visit()\n    return _stats.snapshot()\n\n\nhealth_router = Route(\"GET\", \"/health\", health)\nstats_router = Route(\"GET\", \"/stats\", stats)\n", "modify"), sn("app/main.py", "from app.routers.health import health_router, stats_router\n\n\ndef create_app():\n    return [health_router, stats_router]\n\n\ndef main() -> None:\n    for route in create_app():\n        print(route.method, route.path, route.handler())\n\n\nif __name__ == \"__main__\":\n    main()\n", "modify")]),
        ],
    ),
]

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, data in [("java", JAVA), ("kotlin", KOTLIN), ("python", PYTHON)]:
        (OUT / f"{name}.json").write_text(json.dumps(data, indent=2) + "\n")
        print(f"wrote {OUT / f'{name}.json'} ({len(data)} projects)")
