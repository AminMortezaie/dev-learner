import type { SyntaxLessonSeed } from "../syntax-lessons.ts";

/**
 * Java syntax lessons with real-world references to Spring Framework,
 * Apache Kafka, Netflix Hystrix, and Project Loom in the JDK itself.
 */
export const JAVA_LESSONS: SyntaxLessonSeed[] = [
  {
    languageSlug: "java",
    title: "Classes, fields, and constructors",
    concept: "A class declares state (fields) and behavior (methods + constructors).",
    rawSyntax: `public class User {
    private final String email;
    private String name;

    public User(String email, String name) {
        this.email = email;
        this.name = name;
    }

    public String getEmail() { return email; }
}`,
    explanation:
      "Prefer final fields for immutable state. The constructor establishes invariants — validate inputs there, not in setters. Modern Java tip: consider a record (see the records lesson) if the class is just data.",
    realWorldExample: `// spring-projects/spring-framework — DefaultListableBeanFactory.java (excerpt)
public class DefaultListableBeanFactory extends AbstractAutowireCapableBeanFactory
        implements ConfigurableListableBeanFactory, BeanDefinitionRegistry, Serializable {

    private final Map<String, BeanDefinition> beanDefinitionMap = new ConcurrentHashMap<>(256);
    private volatile List<String> beanDefinitionNames = new ArrayList<>(256);

    public DefaultListableBeanFactory() {
        super();
    }
}`,
    githubProject: "spring-projects/spring-framework — DefaultListableBeanFactory.java",
    githubUrl:
      "https://github.com/spring-projects/spring-framework/blob/v6.1.13/spring-beans/src/main/java/org/springframework/beans/factory/support/DefaultListableBeanFactory.java",
    difficulty: "beginner",
    category: "Basics",
  },
  {
    languageSlug: "java",
    title: "Generics and bounded type parameters",
    concept: "<T extends Comparable<T>> lets you write reusable, type-safe code.",
    rawSyntax: `public static <T extends Comparable<T>> T max(List<T> xs) {
    T best = xs.get(0);
    for (T x : xs) if (x.compareTo(best) > 0) best = x;
    return best;
}`,
    explanation:
      "Bounds let callers pass any Comparable. Type parameters are erased at runtime (type erasure), which is why you cannot do new T() or instanceof T<String>.",
    realWorldExample: `// apache/kafka — Sender.java (excerpt)
public final class Sender implements Runnable {
    public <K, V> ProducerInterceptors<K, V> interceptors() {
        return (ProducerInterceptors<K, V>) this.interceptors;
    }
}`,
    githubProject: "apache/kafka — clients/.../Sender.java",
    githubUrl:
      "https://github.com/apache/kafka/blob/3.8.0/clients/src/main/java/org/apache/kafka/clients/producer/internals/Sender.java",
    difficulty: "beginner",
    category: "Language",
  },
  {
    languageSlug: "java",
    title: "try-with-resources",
    concept: "AutoCloseable resources are closed deterministically at the end of the block.",
    rawSyntax: `try (var in = Files.newBufferedReader(path);
     var out = Files.newBufferedWriter(other)) {
    in.transferTo(out);
} // both closed here, even on exception`,
    explanation:
      "Resources are closed in reverse order of declaration. If close() throws, the exception is added as a suppressed exception on any primary one — never silently swallowed.",
    realWorldExample: `// apache/kafka — FileRecords.java (excerpt)
try (FileChannel channel = openChannel(file, mutable, fileAlreadyExists, initFileSize, preallocate)) {
    if (channel.size() != end) {
        // truncate / handle
    }
}`,
    githubProject: "apache/kafka — clients/.../FileRecords.java",
    githubUrl:
      "https://github.com/apache/kafka/blob/3.8.0/clients/src/main/java/org/apache/kafka/common/record/FileRecords.java",
    difficulty: "intermediate",
    category: "Language",
  },
  {
    languageSlug: "java",
    title: "Records and pattern matching",
    concept: "Records are immutable data carriers; pattern switches make them ergonomic.",
    rawSyntax: `sealed interface Shape permits Circle, Square {}
record Circle(double r) implements Shape {}
record Square(double side) implements Shape {}

double area(Shape s) {
    return switch (s) {
        case Circle c  -> Math.PI * c.r() * c.r();
        case Square sq -> sq.side() * sq.side();
    };
}`,
    explanation:
      "Records auto-generate equals, hashCode, toString and accessors. Combined with sealed types, the compiler enforces exhaustive switches — closing one of Java's oldest pain points.",
    realWorldExample: `// openjdk/jdk — Diamond.java sample (modern style)
public sealed interface Json permits JsonObject, JsonArray, JsonString, JsonNumber, JsonBool, JsonNull {}
public record JsonObject(Map<String, Json> values) implements Json {}
public record JsonArray(List<Json> values) implements Json {}
public record JsonString(String value) implements Json {}`,
    githubProject: "openjdk/jdk (illustrative — modern JDK patterns)",
    githubUrl: "https://github.com/openjdk/jdk/tree/jdk-21-ga",
    difficulty: "intermediate",
    category: "Language",
  },
  {
    languageSlug: "java",
    title: "Streams and collectors",
    concept: "Streams express data transformations declaratively over collections.",
    rawSyntax: `Map<Department, List<Employee>> byDept = employees.stream()
    .filter(e -> e.salary() > 100_000)
    .collect(groupingBy(Employee::department));`,
    explanation:
      "Streams are lazy: intermediate ops (filter, map) build a pipeline that runs only when a terminal op (collect, forEach) is invoked. Don't reuse a stream — they are single-use.",
    realWorldExample: `// spring-projects/spring-framework — AnnotationAttributes.java (excerpt)
return Arrays.stream(annotations)
        .map(this::getMergedAttributes)
        .filter(Objects::nonNull)
        .collect(Collectors.toMap(
                attrs -> attrs.annotationType(),
                Function.identity()));`,
    githubProject: "spring-projects/spring-framework — AnnotationAttributes.java",
    githubUrl:
      "https://github.com/spring-projects/spring-framework/blob/v6.1.13/spring-core/src/main/java/org/springframework/core/annotation/AnnotationAttributes.java",
    difficulty: "intermediate",
    category: "Language",
  },
  {
    languageSlug: "java",
    title: "CompletableFuture composition",
    concept: "CompletableFuture composes async work without callback hell.",
    rawSyntax: `CompletableFuture<User> u = fetchUser(id);
CompletableFuture<List<Order>> o = u.thenCompose(this::fetchOrders);
o.whenComplete((orders, err) -> {
    if (err != null) log.error("failed", err);
    else log.info("got {} orders", orders.size());
});`,
    explanation:
      "thenCompose chains async ops (flatMap), thenApply transforms results (map), and exceptionally / handle deal with failures. Always pass an explicit Executor for I/O — the default ForkJoinPool.commonPool is shared with the whole JVM.",
    realWorldExample: `// spring-projects/spring-framework — WebClient async usage
webClient.get().uri("/users/{id}", id)
    .retrieve()
    .bodyToMono(User.class)
    .toFuture()
    .thenCompose(user -> ordersClient.fetchOrders(user.id()).toFuture())
    .whenComplete((orders, err) -> /* ... */);`,
    githubProject: "spring-projects/spring-framework — reactive WebClient",
    githubUrl:
      "https://github.com/spring-projects/spring-framework/blob/v6.1.13/spring-webflux/src/main/java/org/springframework/web/reactive/function/client/WebClient.java",
    difficulty: "advanced",
    category: "Concurrency",
  },
  {
    languageSlug: "java",
    title: "Virtual threads (JEP 444)",
    concept: "Thread.ofVirtual() gives you cheap threads that scale to millions.",
    rawSyntax: `try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    var futures = ids.stream()
        .map(id -> executor.submit(() -> fetch(id)))
        .toList();
    for (var f : futures) handle(f.get());
}`,
    explanation:
      "Virtual threads park efficiently when they block on I/O — no more thread-per-request anxieties. Avoid synchronized blocks around blocking calls (causes 'pinning') and use ReentrantLock instead.",
    realWorldExample: `// openjdk/jdk — VirtualThread.java (the runtime itself)
final class VirtualThread extends BaseVirtualThread {
    private static final ContinuationScope VTHREAD_SCOPE = new ContinuationScope("VirtualThreads");
    private final Continuation cont;
    private final Runnable runContinuation;
}`,
    githubProject: "openjdk/jdk — VirtualThread.java",
    githubUrl:
      "https://github.com/openjdk/jdk/blob/jdk-21-ga/src/java.base/share/classes/java/lang/VirtualThread.java",
    difficulty: "advanced",
    category: "Concurrency",
  },
];
