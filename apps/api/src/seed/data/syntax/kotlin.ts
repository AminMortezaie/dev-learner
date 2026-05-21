import type { SyntaxLessonSeed } from "../syntax-lessons.ts";

export const KOTLIN_LESSONS: SyntaxLessonSeed[] = [
  {
    languageSlug: "kotlin",
    title: "val, var, and type inference",
    concept: "val is read-only; var is mutable. Types are inferred where possible.",
    rawSyntax: `val name = "Junie"          // String, immutable
var counter = 0             // Int, mutable
val explicit: Long = 42L`,
    explanation:
      "Prefer val by default — immutability eliminates a class of concurrency bugs. The compiler infers types from initializers; declare them explicitly only at API boundaries.",
    realWorldExample: `// ktorio/ktor — Application.kt (excerpt)
val module: Application.() -> Unit = {
    install(ContentNegotiation) { json() }
    routing {
        get("/health") { call.respondText("OK") }
    }
}`,
    githubProject: "ktorio/ktor — Application.kt",
    githubUrl:
      "https://github.com/ktorio/ktor/blob/3.0.0/ktor-server/ktor-server-core/jvmAndNix/src/io/ktor/server/application/Application.kt",
    difficulty: "beginner",
    category: "Basics",
  },
  {
    languageSlug: "kotlin",
    title: "Data classes",
    concept: "data class auto-generates equals, hashCode, toString, and copy.",
    rawSyntax: `data class User(val id: Long, val email: String, val name: String)

val u1 = User(1, "a@x", "Ada")
val u2 = u1.copy(name = "Ada L.")`,
    explanation:
      "Data classes are Kotlin's record. Use them for transport/DTO types. They cannot be open and must have at least one constructor parameter.",
    realWorldExample: `// JetBrains/kotlinx.serialization — ExampleClasses.kt
@Serializable
data class Project(val name: String, val language: String = "Kotlin")`,
    githubProject: "Kotlin/kotlinx.serialization",
    githubUrl:
      "https://github.com/Kotlin/kotlinx.serialization/blob/v1.7.3/README.md",
    difficulty: "beginner",
    category: "Language",
  },
  {
    languageSlug: "kotlin",
    title: "Null safety and the Elvis operator",
    concept: "Types are non-null by default; ? marks nullable, ?: provides a default.",
    rawSyntax: `fun greet(name: String?): String {
    val n = name?.trim()?.takeIf { it.isNotEmpty() } ?: "stranger"
    return "Hello, $n"
}`,
    explanation:
      "?. only invokes if non-null, otherwise returns null. ?: returns its right side when the left is null. Together they replace most defensive if (x != null) chains.",
    realWorldExample: `// ktorio/ktor — Routing.kt (excerpt)
val configuredHost = environment.config.propertyOrNull("ktor.deployment.host")?.getString() ?: "0.0.0.0"`,
    githubProject: "ktorio/ktor — server config",
    githubUrl:
      "https://github.com/ktorio/ktor/tree/3.0.0/ktor-server/ktor-server-core",
    difficulty: "beginner",
    category: "Language",
  },
  {
    languageSlug: "kotlin",
    title: "Extension functions",
    concept: "Add methods to existing types without inheritance.",
    rawSyntax: `fun String.isEmail(): Boolean =
    matches(Regex("^[\\\\w.+-]+@[\\\\w.-]+\\\\.[A-Za-z]{2,}$"))

"a@b.io".isEmail()  // true`,
    explanation:
      "Extensions are resolved statically — they don't actually modify the target class. Use them to keep call sites fluent without polluting the type hierarchy.",
    realWorldExample: `// Kotlin/kotlinx.coroutines — Flow.kt (excerpt)
public fun <T> Flow<T>.onEach(action: suspend (T) -> Unit): Flow<T> = transform { value ->
    action(value)
    return@transform emit(value)
}`,
    githubProject: "Kotlin/kotlinx.coroutines — Flow.kt",
    githubUrl:
      "https://github.com/Kotlin/kotlinx.coroutines/blob/1.9.0/kotlinx-coroutines-core/common/src/flow/operators/Transform.kt",
    difficulty: "intermediate",
    category: "Language",
  },
  {
    languageSlug: "kotlin",
    title: "Coroutines: launch and async",
    concept: "launch fires-and-forgets, async returns a Deferred you can await.",
    rawSyntax: `coroutineScope {
    val user  = async { fetchUser(id) }
    val perms = async { fetchPerms(id) }
    render(user.await(), perms.await())
}`,
    explanation:
      "Both run inside a CoroutineScope. If any child fails, the parent cancels its siblings — that's structured concurrency. Never use GlobalScope in app code; it leaks.",
    realWorldExample: `// Kotlin/kotlinx.coroutines — README
suspend fun loadAndCombine(name1: String, name2: String): Image = coroutineScope {
    val deferred1 = async { loadImage(name1) }
    val deferred2 = async { loadImage(name2) }
    combineImages(deferred1.await(), deferred2.await())
}`,
    githubProject: "Kotlin/kotlinx.coroutines — README",
    githubUrl: "https://github.com/Kotlin/kotlinx.coroutines/blob/1.9.0/README.md",
    difficulty: "intermediate",
    category: "Concurrency",
  },
  {
    languageSlug: "kotlin",
    title: "Sealed classes and exhaustive when",
    concept: "Sealed hierarchies model closed sets; when becomes exhaustive.",
    rawSyntax: `sealed interface Result<out T> {
    data class Ok<T>(val value: T) : Result<T>
    data class Err(val message: String) : Result<Nothing>
}

fun render(r: Result<String>) = when (r) {
    is Result.Ok  -> println(r.value)
    is Result.Err -> println("!! \${r.message}")
}`,
    explanation:
      "Sealed types are known to the compiler at compile time, so when needs no else branch — add a new subclass and unhandled call sites become compile errors.",
    realWorldExample: `// JetBrains/kotlinx.coroutines — Channel.kt has sealed ChannelResult
public sealed class ChannelResult<out T> {
    public class Success<T> internal constructor(public val value: T) : ChannelResult<T>()
    public object Failed : ChannelResult<Nothing>()
}`,
    githubProject: "Kotlin/kotlinx.coroutines — Channel.kt",
    githubUrl:
      "https://github.com/Kotlin/kotlinx.coroutines/blob/1.9.0/kotlinx-coroutines-core/common/src/channels/Channel.kt",
    difficulty: "intermediate",
    category: "Language",
  },
  {
    languageSlug: "kotlin",
    title: "inline and reified generics",
    concept: "inline + reified preserves the type argument at runtime.",
    rawSyntax: `inline fun <reified T> Gson.fromJson(json: String): T =
    fromJson(json, T::class.java)

val u: User = gson.fromJson(s)`,
    explanation:
      "Inline copies the function body into the call site; reified makes T available as if it were a regular Class. This avoids the JVM type erasure that normally prevents T::class.java.",
    realWorldExample: `// Kotlin/kotlinx.serialization — Json.kt (excerpt)
public inline fun <reified T> Json.decodeFromString(string: String): T =
    decodeFromString(serializersModule.serializer<T>(), string)`,
    githubProject: "Kotlin/kotlinx.serialization — Json.kt",
    githubUrl:
      "https://github.com/Kotlin/kotlinx.serialization/blob/v1.7.3/formats/json/commonMain/src/kotlinx/serialization/json/Json.kt",
    difficulty: "advanced",
    category: "Language",
  },
];
