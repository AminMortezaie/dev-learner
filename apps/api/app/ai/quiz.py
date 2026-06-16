from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import settings

DEFAULT_COUNT = 10
POLISH_CHUNK = 6000


@dataclass
class GeneratedQuestion:
    question: str
    options: list[str]
    correct_answer: int
    explanation: str


def _ai_config() -> dict[str, str] | None:
    api_key = settings.resolved_ai_api_key
    if not api_key:
        return None
    base_url = (settings.ai_base_url or "https://api.cerebras.ai/v1").rstrip("/")
    model = settings.ai_model or os.getenv("AI_MODEL", "gpt-oss-120b")
    return {"api_key": api_key, "base_url": base_url, "model": model}


def _ai_chat(
    cfg: dict[str, str],
    messages: list[dict[str, str]],
    max_tokens: int = 512,
    json_mode: bool = True,
) -> str:
    body: dict[str, Any] = {
        "model": cfg["model"],
        "temperature": 0.3,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    with httpx.Client(timeout=30.0) as client:
        res = client.post(
            f"{cfg['base_url']}/chat/completions",
            headers={
                "content-type": "application/json",
                "authorization": f"Bearer {cfg['api_key']}",
            },
            json=body,
        )
    if res.status_code >= 400:
        raise RuntimeError(f"AI HTTP {res.status_code}: {res.text[:300]}")
    data = res.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not content:
        raise RuntimeError("AI returned no content")
    return content


def polish_content(raw_text: str) -> str:
    cfg = _ai_config()
    if not cfg:
        raise RuntimeError("AI_API_KEY is required for content polishing")

    system = (
        "You are a technical writing editor. Reformat the given raw text as clean Markdown. "
        "STRICT RULES: "
        "1. Output ONLY the reformatted input text — nothing else. "
        "2. Do NOT add introductions, conclusions, summaries, closing remarks, or any text not present in the input. "
        "3. Do NOT omit or summarize any part of the input. "
        "4. Only restructure: add ## headings, bullet lists, numbered lists, code blocks with language hints, **bold** for key terms. "
        "5. Output raw Markdown text only — no JSON, no fences around the whole response, no commentary."
    )

    chunks = [raw_text[i : i + POLISH_CHUNK] for i in range(0, len(raw_text), POLISH_CHUNK)]
    polished: list[str] = []
    for idx, chunk in enumerate(chunks):
        user = (
            f"Polish part {idx + 1} of {len(chunks)}:\n\n{chunk}"
            if len(chunks) > 1
            else f"Polish the following content:\n\n{chunk}"
        )
        result = _ai_chat(
            cfg,
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
            max_tokens=4096,
            json_mode=False,
        )
        polished.append(result.strip())

    return "\n\n".join(s for s in polished if s)


def generate_quiz_from_article(
    *,
    title: str,
    content: str,
    language: str | None = None,
    count: int | None = None,
) -> list[GeneratedQuestion]:
    n = count or DEFAULT_COUNT
    cfg = _ai_config()
    if cfg:
        try:
            return _generate_quiz_with_ai(title, content, language, n, cfg)
        except Exception as err:
            print(f"[ai] Quiz generation failed, falling back to heuristic: {err}")
    return _generate_heuristic(title, content, n)


def _generate_quiz_with_ai(
    title: str,
    content: str,
    language: str | None,
    count: int,
    cfg: dict[str, str],
) -> list[GeneratedQuestion]:
    lang_hint = f" The article is about {language}." if language else ""
    system = (
        "You are an expert technical educator creating quizzes for senior software engineers. "
        "You output ONLY valid JSON matching the requested schema. Do not include prose, "
        "markdown fences, or commentary. Questions must test deep understanding, not trivia."
    )
    snippet = content[:6000]
    user = (
        f"Generate exactly {count} multiple-choice questions from the article below.{lang_hint} "
        "Requirements:\n"
        "- Each question has exactly 4 plausible options.\n"
        "- 'correctAnswer' is the 0-based index of the correct option.\n"
        "- Include a 1–2 sentence 'explanation' grounded in the article.\n"
        "- Avoid yes/no questions. Prefer 'why', 'when', and 'which is most accurate' framings.\n"
        f'\nReturn JSON: {{"questions":[{{"question":string,"options":[string,string,string,string],"correctAnswer":number,"explanation":string}}]}}\n'
        f"\n=== ARTICLE: {title} ===\n{snippet}\n=== END ARTICLE ==="
    )
    raw = _ai_chat(cfg, [{"role": "system", "content": system}, {"role": "user", "content": user}], 3072)
    parsed = json.loads(raw)
    return _validate_questions(parsed.get("questions"), count)


def _validate_questions(value: Any, expected: int) -> list[GeneratedQuestion]:
    if not isinstance(value, list):
        raise ValueError("'questions' is not an array")
    out: list[GeneratedQuestion] = []
    for raw in value:
        if not isinstance(raw, dict):
            continue
        question = str(raw.get("question", "")).strip()
        options = [str(x).strip() for x in raw.get("options", []) if isinstance(x, str)]
        correct = raw.get("correctAnswer", raw.get("correct_answer", -1))
        correct_answer = int(correct) if isinstance(correct, (int, float)) else -1
        explanation = str(raw.get("explanation", "")).strip()
        if question and len(options) >= 2 and 0 <= correct_answer < len(options):
            out.append(
                GeneratedQuestion(
                    question=question,
                    options=options,
                    correct_answer=correct_answer,
                    explanation=explanation,
                )
            )
    if not out:
        raise ValueError(f"No valid questions in AI response (expected {expected})")
    return out


def _split_sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if 20 < len(s.strip()) < 280]


def _extract_key_terms(text: str) -> list[str]:
    stop = {
        "the", "and", "for", "with", "that", "this", "from", "into", "your", "you", "are", "was",
        "but", "not", "have", "has", "can", "will", "would", "could", "should", "may", "might",
        "their", "there", "these", "those", "when", "where", "what", "which", "why", "how", "its",
        "also", "more", "most", "such", "than", "then", "they", "them", "were", "been",
    }
    freq: dict[str, int] = {}
    for m in re.finditer(r"[A-Za-z][A-Za-z0-9_-]{3,}", text):
        t = m.group(0)
        if t.lower() in stop:
            continue
        freq[t] = freq.get(t, 0) + 1
    return [k for k, _ in sorted(freq.items(), key=lambda x: -x[1])[:16]]


def _shuffle_stable(arr: list[str], seed: int) -> list[str]:
    out = arr[:]
    for i in range(len(out) - 1, 0, -1):
        j = (seed * 9301 + 49297 + i) % (i + 1)
        out[i], out[j] = out[j], out[i]
    return out


def _generate_heuristic(title: str, content: str, count: int) -> list[GeneratedQuestion]:
    sentences = _split_sentences(content)
    key_terms = _extract_key_terms(content)
    out: list[GeneratedQuestion] = []

    parts = re.split(r"(?<=[.!?])\s+", content)
    first = parts[0].strip() if parts else ""
    summary = first[:160] if len(first) > 20 else f"An overview of {title}"

    out.append(
        GeneratedQuestion(
            question=f'What is the primary subject of "{title}"?',
            options=[
                summary,
                "An unrelated framework comparison",
                "A historical retrospective of programming languages",
                "A bug report",
            ],
            correct_answer=0,
            explanation="The article's title and opening sentences establish its primary subject.",
        )
    )

    for i in range(min(count - 1, len(sentences), len(key_terms))):
        sentence = sentences[i]
        term = key_terms[i]
        if term.lower() not in sentence.lower():
            continue
        masked = re.sub(term, "____", sentence, count=1, flags=re.I)
        distractors = [t for t in key_terms if t.lower() != term.lower()][:3]
        options = _shuffle_stable([term, *distractors], i)
        out.append(
            GeneratedQuestion(
                question=f"Fill in the blank: {masked}",
                options=options,
                correct_answer=options.index(term),
                explanation=f'The article states: "{sentence.strip()}"',
            )
        )

    while len(out) < count:
        idx = len(out)
        out.append(
            GeneratedQuestion(
                question="According to the article, which statement is most accurate?",
                options=[
                    sentences[idx % max(1, len(sentences))][:140] if sentences else title,
                    "The opposite of what the article claims",
                    "A claim the article never makes",
                    "An unrelated tangent",
                ],
                correct_answer=0,
                explanation=f"Derived from sentence {idx + 1} of the article.",
            )
        )

    return out[:count]
