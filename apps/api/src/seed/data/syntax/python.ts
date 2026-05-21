import type { SyntaxLessonSeed } from "../syntax-lessons.ts";

export const PYTHON_LESSONS: SyntaxLessonSeed[] = [
  {
    languageSlug: "python",
    title: "Functions, defaults, and *args/**kwargs",
    concept: "def with positional, default, *args, and **kwargs parameters.",
    rawSyntax: `def fetch(url, *, timeout=5, **headers):
    return _do(url, timeout=timeout, headers=headers)`,
    explanation:
      "Arguments after * are keyword-only. Never use a mutable default like def f(x=[]) — the list is shared across calls. Use None and create the list inside the body.",
    realWorldExample: `# django/django — django/http/request.py (excerpt)
def get_full_path(self, force_append_slash=False):
    return self._get_full_path(self.path, force_append_slash)`,
    githubProject: "django/django — http/request.py",
    githubUrl:
      "https://github.com/django/django/blob/5.1/django/http/request.py",
    difficulty: "beginner",
    category: "Basics",
  },
  {
    languageSlug: "python",
    title: "List, dict, and set comprehensions",
    concept: "Build collections with declarative expressions.",
    rawSyntax: `squares = [x*x for x in range(10) if x % 2 == 0]
by_name = {u.name: u for u in users}
seen    = {w.lower() for w in words}`,
    explanation:
      "Comprehensions are faster and clearer than equivalent for-append loops. Don't overuse them — once you need two filters and a transform, a real loop or generator function reads better.",
    realWorldExample: `# pallets/flask — src/flask/app.py
view_args = {k: v for k, v in request.view_args.items() if k != "_method"}`,
    githubProject: "pallets/flask — app.py",
    githubUrl:
      "https://github.com/pallets/flask/blob/3.0.3/src/flask/app.py",
    difficulty: "beginner",
    category: "Language",
  },
  {
    languageSlug: "python",
    title: "Dataclasses",
    concept: "@dataclass auto-generates __init__, __repr__, __eq__.",
    rawSyntax: `from dataclasses import dataclass, field

@dataclass(frozen=True)
class User:
    id: int
    email: str
    tags: list[str] = field(default_factory=list)`,
    explanation:
      "Use frozen=True for immutability (also makes the instance hashable). Use field(default_factory=...) for mutable defaults; never assign [] or {} as the default value directly.",
    realWorldExample: `# tiangolo/fastapi — fastapi/openapi/models.py uses pydantic, but the
# pattern is the same: declarative typed data carriers.
@dataclass
class ResponseField:
    field_info: FieldInfo
    response_class: type
    status_code: int`,
    githubProject: "tiangolo/fastapi — openapi/models.py",
    githubUrl:
      "https://github.com/tiangolo/fastapi/blob/0.115.0/fastapi/openapi/models.py",
    difficulty: "intermediate",
    category: "Language",
  },
  {
    languageSlug: "python",
    title: "Context managers (with)",
    concept: "with closes resources deterministically via __enter__/__exit__.",
    rawSyntax: `from contextlib import contextmanager

@contextmanager
def timing(label):
    t0 = time.perf_counter()
    try:
        yield
    finally:
        print(label, time.perf_counter() - t0)`,
    explanation:
      "The yield separates setup from teardown. The finally guarantees teardown even on exception. For async cleanup use @asynccontextmanager + async with.",
    realWorldExample: `# psf/requests — sessions.py
with self.get_adapter(url=request.url).send(request, **kwargs) as resp:
    if not stream:
        resp.content
return resp`,
    githubProject: "psf/requests — sessions.py",
    githubUrl:
      "https://github.com/psf/requests/blob/v2.32.3/src/requests/sessions.py",
    difficulty: "intermediate",
    category: "Language",
  },
  {
    languageSlug: "python",
    title: "asyncio with TaskGroup",
    concept: "TaskGroup (3.11+) cancels siblings if any task fails.",
    rawSyntax: `async def main():
    async with asyncio.TaskGroup() as tg:
        u = tg.create_task(fetch_user(id))
        p = tg.create_task(fetch_perms(id))
    render(u.result(), p.result())`,
    explanation:
      "TaskGroup is structured concurrency for Python. If any task raises, all siblings are cancelled and an ExceptionGroup is raised. Prefer it over bare asyncio.gather for new code.",
    realWorldExample: `# tiangolo/fastapi — fastapi/concurrency.py uses anyio task groups
async with anyio.create_task_group() as task_group:
    task_group.start_soon(run_endpoint_function, dependant.call, values)`,
    githubProject: "tiangolo/fastapi — concurrency.py",
    githubUrl:
      "https://github.com/tiangolo/fastapi/blob/0.115.0/fastapi/concurrency.py",
    difficulty: "advanced",
    category: "Concurrency",
  },
  {
    languageSlug: "python",
    title: "Type hints and Protocols",
    concept: "Static structural typing via typing.Protocol.",
    rawSyntax: `from typing import Protocol

class Closeable(Protocol):
    def close(self) -> None: ...

def shutdown(x: Closeable) -> None:
    x.close()`,
    explanation:
      "A class satisfies a Protocol just by having the right methods — no inheritance needed. Use Protocol for duck-typed APIs you want type checkers to verify.",
    realWorldExample: `# pandas-dev/pandas — pandas/core/arrays/base.py uses Protocols
class ExtensionArraySupportsAnyAll(Protocol):
    def any(self, *, skipna: bool = True) -> bool: ...
    def all(self, *, skipna: bool = True) -> bool: ...`,
    githubProject: "pandas-dev/pandas — extension arrays",
    githubUrl:
      "https://github.com/pandas-dev/pandas/blob/v2.2.3/pandas/core/arrays/base.py",
    difficulty: "advanced",
    category: "Language",
  },
];
