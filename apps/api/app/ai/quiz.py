from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import settings

DEFAULT_COUNT = settings.ai_quiz_default_count


def _normalize_for_ai(text: str, max_chars: int) -> str:
    collapsed = re.sub(r"\n{3,}", "\n\n", text.strip())
    collapsed = re.sub(r"[ \t]+", " ", collapsed)
    if len(collapsed) <= max_chars:
        return collapsed
    cut = collapsed[:max_chars]
    last_para = cut.rfind("\n\n")
    if last_para > max_chars // 2:
        return cut[:last_para].strip()
    return cut.rstrip()


def _quiz_output_tokens(count: int) -> int:
    estimated = count * 200 + 256
    return min(estimated, settings.ai_quiz_max_output_tokens)


def _polish_output_tokens(chunk_len: int) -> int:
    estimated = chunk_len // 2 + 256
    return min(max(estimated, 512), settings.ai_polish_max_output_tokens)


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
        "Reformat raw text as clean Markdown only. "
        "Do not add, remove, or summarize content — only restructure with headings, lists, "
        "code blocks, and bold. No commentary or wrapping fences."
    )

    chunk_size = settings.ai_polish_chunk_chars
    chunks = [raw_text[i : i + chunk_size] for i in range(0, len(raw_text), chunk_size)]
    polished: list[str] = []
    for idx, chunk in enumerate(chunks):
        user = (
            f"Part {idx + 1}/{len(chunks)}:\n\n{chunk}"
            if len(chunks) > 1
            else chunk
        )
        result = _ai_chat(
            cfg,
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
            max_tokens=_polish_output_tokens(len(chunk)),
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
    exclude: set[str] | None = None,
) -> list[GeneratedQuestion]:
    n = count or DEFAULT_COUNT
    seen = set(exclude or ())

    def _unique(questions: list[GeneratedQuestion]) -> list[GeneratedQuestion]:
        out: list[GeneratedQuestion] = []
        for q in questions:
            if q.question in seen:
                continue
            seen.add(q.question)
            out.append(q)
        return out

    cfg = _ai_config()
    if cfg:
        try:
            ai_questions = _unique(
                _generate_quiz_with_ai(title, content, language, n, cfg, exclude=seen)
            )
            if len(ai_questions) >= n:
                return ai_questions[:n]
            extra = _generate_heuristic(title, content, n - len(ai_questions), exclude=seen)
            return ai_questions + extra
        except Exception as err:
            print(f"[ai] Quiz generation failed, falling back to heuristic: {err}")
    return _generate_heuristic(title, content, n, exclude=seen)


def _generate_quiz_with_ai(
    title: str,
    content: str,
    language: str | None,
    count: int,
    cfg: dict[str, str],
    exclude: set[str] | None = None,
) -> list[GeneratedQuestion]:
    lang_hint = f" Topic: {language}." if language else ""
    system = (
        "Output only valid JSON. Every question must be directly answerable from the article text. "
        "Do not invent facts. The correct option must be unambiguously supported by the article."
    )
    snippet = _normalize_for_ai(content, settings.ai_quiz_article_chars)
    user = (
        f"Generate {count} MCQs from the article.{lang_hint} "
        "4 options each, correctAnswer is 0-based index, 1-sentence explanation.\n"
        f'JSON: {{"questions":[{{"question":string,"options":[string,string,string,string],'
        f'"correctAnswer":number,"explanation":string}}]}}\n'
        f"=== {title} ===\n{snippet}"
    )
    if exclude:
        existing = [q[:120] for q in list(exclude)[:12]]
        user += "\n\nDo not repeat or closely rephrase these existing questions:\n- " + "\n- ".join(existing)
    raw = _ai_chat(
        cfg,
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        _quiz_output_tokens(count),
    )
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



def _strip_markdown_noise(text: str) -> str:
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.M)
    return re.sub(r"`([^`]+)`", r"\1", text)


def _dedupe_preserve(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def _split_sentences(text: str) -> list[str]:
    body = re.sub(r"^#{1,6}\s+.+$", "", text, flags=re.M)
    plain = _strip_markdown_noise(body)
    sentences: list[str] = []
    for s in re.split(r"(?<=[.!?])\s+", plain):
        s = re.sub(r"\s+", " ", s).strip()
        if 20 < len(s) < 320:
            sentences.append(s)
    for m in re.finditer(r"^[-*]\s+(.+)$", text, re.M):
        item = re.sub(r"\s+", " ", m.group(1)).strip()
        if 20 < len(item) < 320:
            sentences.append(item)
    return _dedupe_preserve(sentences)


def _extract_headings(text: str) -> list[str]:
    headings = [m.group(1).strip() for m in re.finditer(r"^#{1,3}\s+(.+)$", text, re.M)]
    return _dedupe_preserve([h for h in headings if 4 < len(h) < 100])


def _extract_bullets(text: str) -> list[str]:
    bullets = [m.group(1).strip() for m in re.finditer(r"^[-*]\s+(.+)$", text, re.M)]
    return _dedupe_preserve([b for b in bullets if 15 < len(b) < 280])


def _extract_backtick_terms(text: str) -> list[str]:
    return _dedupe_preserve(t.strip() for t in re.findall(r"`([^`\n]+)`", text) if 2 < len(t.strip()) < 40)


def _extract_key_terms(text: str, limit: int = 40) -> list[str]:
    stop = {
        "the", "and", "for", "with", "that", "this", "from", "into", "your", "you", "are", "was",
        "but", "not", "have", "has", "can", "will", "would", "could", "should", "may", "might",
        "their", "there", "these", "those", "when", "where", "what", "which", "why", "how", "its",
        "also", "more", "most", "such", "than", "then", "they", "them", "were", "been", "about",
        "using", "used", "use", "like", "just", "only", "other", "some", "each", "make", "made",
        "article", "example", "function", "method", "class", "return", "value", "type", "types",
    }
    terms = list(_extract_backtick_terms(text))
    plain = _strip_markdown_noise(text)
    freq: dict[str, int] = {}
    for m in re.finditer(r"[A-Za-z][A-Za-z0-9_-]{3,}", plain):
        t = m.group(0)
        if t.lower() in stop:
            continue
        freq[t] = freq.get(t, 0) + 1
    ranked = [k for k, _ in sorted(freq.items(), key=lambda x: (-x[1], x[0]))]
    for term in ranked:
        if term not in terms:
            terms.append(term)
        if len(terms) >= limit:
            break
    return terms


def _is_strong_term(term: str, *, backtick_terms: set[str], heading_terms: set[str]) -> bool:
    if term in backtick_terms:
        return True
    if len(term) < 5 or term.lower() in _TERM_STOP:
        return False
    if term.lower() in heading_terms and term not in backtick_terms:
        return False
    if re.search(r"[A-Z]", term[1:]) or "_" in term or re.search(r"\d", term):
        return True
    return len(term) >= 8


_TERM_STOP = {
    "about", "after", "also", "article", "because", "before", "between", "channel",
    "channels", "class", "concurrency", "content", "could", "data", "example", "first",
    "from", "function", "into", "lightweight", "method", "operations", "other", "return",
    "safely", "second", "should", "statement", "statements", "their", "there", "these",
    "those", "through", "under", "using", "value", "which", "while", "would", "write",
}


def _shuffle_stable(arr: list[str], seed: int) -> list[str]:
    out = arr[:]
    for i in range(len(out) - 1, 0, -1):
        j = (seed * 9301 + 49297 + i) % (i + 1)
        out[i], out[j] = out[j], out[i]
    return out


def _valid_distractors(correct: str, candidates: list[str]) -> list[str] | None:
    correct_norm = correct.strip().lower()
    out: list[str] = []
    seen: set[str] = {correct_norm}
    for item in candidates:
        value = item.strip()
        key = value.lower()
        if not value or key in seen:
            continue
        seen.add(key)
        out.append(value)
        if len(out) == 3:
            return out
    return None


def _make_mcq(
    question: str,
    correct: str,
    distractors: list[str],
    explanation: str,
    seed: int,
) -> GeneratedQuestion | None:
    correct = correct.strip()
    if not question.strip() or not correct:
        return None
    valid = _valid_distractors(correct, distractors)
    if not valid:
        return None
    options = _shuffle_stable([correct, *valid], seed)
    return GeneratedQuestion(
        question=question.strip(),
        options=options,
        correct_answer=options.index(correct),
        explanation=explanation,
    )


def _term_context(content: str) -> tuple[set[str], set[str]]:
    backtick_terms = set(_extract_backtick_terms(content))
    heading_terms: set[str] = set()
    for heading in _extract_headings(content):
        for word in re.findall(r"[A-Za-z][A-Za-z0-9_-]+", heading):
            heading_terms.add(word.lower())
    return backtick_terms, heading_terms


def _heuristic_term_sentence_questions(
    sentences: list[str],
    key_terms: list[str],
    *,
    backtick_terms: set[str],
    heading_terms: set[str],
) -> list[GeneratedQuestion]:
    out: list[GeneratedQuestion] = []
    for i, term in enumerate(key_terms):
        if not _is_strong_term(term, backtick_terms=backtick_terms, heading_terms=heading_terms):
            continue
        matching = [s for s in sentences if re.search(rf"\b{re.escape(term)}\b", s, re.I)]
        non_matching = [s for s in sentences if not re.search(rf"\b{re.escape(term)}\b", s, re.I)]
        if not matching or len(non_matching) < 3:
            continue
        correct = matching[0][:200]
        distractors = [s[:200] for s in non_matching[:6]]
        q = _make_mcq(
            f'Which sentence from the article mentions "{term}"?',
            correct,
            distractors,
            f'"{term}" appears in: "{matching[0][:220]}"',
            i,
        )
        if q:
            out.append(q)
    return out


def _heuristic_fill_blank_questions(
    sentences: list[str],
    key_terms: list[str],
    *,
    backtick_terms: set[str],
    heading_terms: set[str],
) -> list[GeneratedQuestion]:
    out: list[GeneratedQuestion] = []
    used_pairs: set[tuple[str, str]] = set()
    for i, sentence in enumerate(sentences):
        for term in key_terms:
            if not _is_strong_term(term, backtick_terms=backtick_terms, heading_terms=heading_terms):
                continue
            if not re.search(rf"\b{re.escape(term)}\b", sentence, re.I):
                continue
            pair = (sentence.lower(), term.lower())
            if pair in used_pairs:
                continue
            masked = re.sub(rf"\b{re.escape(term)}\b", "____", sentence, count=1, flags=re.I)
            if masked == sentence or "____" not in masked:
                continue
            used_pairs.add(pair)
            other_terms = [
                t for t in key_terms
                if t.lower() != term.lower()
                and _is_strong_term(t, backtick_terms=backtick_terms, heading_terms=heading_terms)
            ]
            distractors = [t for t in other_terms if t.lower() not in sentence.lower()]
            q = _make_mcq(
                f"Fill in the blank: {masked[:220]}",
                term,
                distractors,
                f'The article states: "{sentence[:220]}"',
                i + len(out) + 17,
            )
            if q:
                out.append(q)
    return out


def _heuristic_heading_questions(headings: list[str]) -> list[GeneratedQuestion]:
    if len(headings) < 4:
        return []
    out: list[GeneratedQuestion] = []
    for i, heading in enumerate(headings):
        distractors = [h for h in headings if h != heading]
        q = _make_mcq(
            "Which of the following is a section heading in this article?",
            heading,
            distractors,
            f'The article contains the heading "{heading}".',
            i + 31,
        )
        if q:
            out.append(q)
    return out


def _heuristic_bullet_blank_questions(
    bullets: list[str],
    key_terms: list[str],
    *,
    backtick_terms: set[str],
    heading_terms: set[str],
) -> list[GeneratedQuestion]:
    out: list[GeneratedQuestion] = []
    for i, bullet in enumerate(bullets):
        local_terms = [t for t in key_terms if re.search(rf"\b{re.escape(t)}\b", bullet, re.I)]
        term = next(
            (t for t in local_terms if _is_strong_term(t, backtick_terms=backtick_terms, heading_terms=heading_terms)),
            None,
        )
        if not term:
            continue
        masked = re.sub(rf"\b{re.escape(term)}\b", "____", bullet, count=1, flags=re.I)
        if "____" not in masked:
            continue
        distractors = [
            t for t in key_terms
            if t.lower() != term.lower() and not re.search(rf"\b{re.escape(t)}\b", bullet, re.I)
        ]
        q = _make_mcq(
            f"Fill in the blank in this bullet point: {masked[:220]}",
            term,
            distractors,
            f'The bullet point reads: "{bullet[:220]}"',
            i + 47,
        )
        if q:
            out.append(q)
    return out


def _collect_heuristic_candidates(_title: str, content: str) -> list[GeneratedQuestion]:
    sentences = _split_sentences(content)
    key_terms = _extract_key_terms(content)
    headings = _extract_headings(content)
    bullets = _extract_bullets(content)
    backtick_terms, heading_terms = _term_context(content)

    candidates: list[GeneratedQuestion] = []
    candidates.extend(
        _heuristic_term_sentence_questions(
            sentences, key_terms, backtick_terms=backtick_terms, heading_terms=heading_terms
        )
    )
    candidates.extend(
        _heuristic_fill_blank_questions(
            sentences, key_terms, backtick_terms=backtick_terms, heading_terms=heading_terms
        )
    )
    candidates.extend(_heuristic_heading_questions(headings))
    candidates.extend(
        _heuristic_bullet_blank_questions(
            bullets, key_terms, backtick_terms=backtick_terms, heading_terms=heading_terms
        )
    )
    return candidates


def _generate_heuristic(
    title: str,
    content: str,
    count: int,
    *,
    exclude: set[str] | None = None,
) -> list[GeneratedQuestion]:
    seen = set(exclude or ())
    out: list[GeneratedQuestion] = []

    for q in _collect_heuristic_candidates(title, content):
        if q.question in seen:
            continue
        seen.add(q.question)
        out.append(q)
        if len(out) >= count:
            break

    return out[:count]
