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
            ai_questions = _unique(_generate_quiz_with_ai(title, content, language, n, cfg))
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
) -> list[GeneratedQuestion]:
    lang_hint = f" Topic: {language}." if language else ""
    system = "Output only valid JSON. Create deep multiple-choice questions, not trivia."
    snippet = _normalize_for_ai(content, settings.ai_quiz_article_chars)
    user = (
        f"Generate {count} MCQs from the article.{lang_hint} "
        "4 options each, correctAnswer is 0-based index, 1-sentence explanation.\n"
        f'JSON: {{"questions":[{{"question":string,"options":[string,string,string,string],'
        f'"correctAnswer":number,"explanation":string}}]}}\n'
        f"=== {title} ===\n{snippet}"
    )
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
    plain = _strip_markdown_noise(text)
    sentences: list[str] = []
    for s in re.split(r"(?<=[.!?])\s+", plain):
        s = re.sub(r"\s+", " ", s).strip()
        if 15 < len(s) < 400:
            sentences.append(s)
    for m in re.finditer(r"^[-*]\s+(.+)$", text, re.M):
        item = re.sub(r"\s+", " ", m.group(1)).strip()
        if 15 < len(item) < 400:
            sentences.append(item)
    return _dedupe_preserve(sentences)


def _extract_headings(text: str) -> list[str]:
    headings = [m.group(1).strip() for m in re.finditer(r"^#{1,3}\s+(.+)$", text, re.M)]
    return _dedupe_preserve([h for h in headings if 3 < len(h) < 120])


def _extract_bullets(text: str) -> list[str]:
    bullets = [m.group(1).strip() for m in re.finditer(r"^[-*]\s+(.+)$", text, re.M)]
    return _dedupe_preserve([b for b in bullets if 10 < len(b) < 300])


def _extract_code_blocks(text: str) -> list[tuple[str | None, str]]:
    blocks: list[tuple[str | None, str]] = []
    for m in re.finditer(r"```(\w+)?\n([\s\S]*?)```", text):
        lang = m.group(1)
        code = m.group(2).strip()
        if len(code) > 10:
            blocks.append((lang, code))
    return blocks


def _extract_key_terms(text: str, limit: int = 64) -> list[str]:
    stop = {
        "the", "and", "for", "with", "that", "this", "from", "into", "your", "you", "are", "was",
        "but", "not", "have", "has", "can", "will", "would", "could", "should", "may", "might",
        "their", "there", "these", "those", "when", "where", "what", "which", "why", "how", "its",
        "also", "more", "most", "such", "than", "then", "they", "them", "were", "been", "about",
        "using", "used", "use", "like", "just", "only", "other", "some", "each", "make", "made",
    }
    plain = _strip_markdown_noise(text)
    freq: dict[str, int] = {}
    for m in re.finditer(r"[A-Za-z][A-Za-z0-9_-]{3,}", plain):
        t = m.group(0)
        if t.lower() in stop:
            continue
        freq[t] = freq.get(t, 0) + 1
    return [k for k, _ in sorted(freq.items(), key=lambda x: (-x[1], x[0]))[:limit]]


def _generic_distractors(seed: int) -> list[str]:
    pool = [
        "An unrelated framework comparison",
        "A historical retrospective of programming languages",
        "A bug report unrelated to the article",
        "A deployment checklist not covered in the text",
        "A language syntax reference from another ecosystem",
        "A performance benchmark the article does not discuss",
    ]
    return _shuffle_stable(pool, seed)[:3]


def _other_sentence_distractors(sentences: list[str], correct_idx: int, seed: int) -> list[str]:
    distractors: list[str] = []
    for offset in range(1, len(sentences) + 1):
        idx = (correct_idx + offset) % len(sentences)
        if idx == correct_idx:
            continue
        snippet = sentences[idx][:140]
        if snippet and snippet not in distractors:
            distractors.append(snippet)
        if len(distractors) >= 3:
            break
    while len(distractors) < 3:
        distractors.extend(_generic_distractors(seed + len(distractors)))
        distractors = _dedupe_preserve(distractors)
    return distractors[:3]


def _shuffle_stable(arr: list[str], seed: int) -> list[str]:
    out = arr[:]
    for i in range(len(out) - 1, 0, -1):
        j = (seed * 9301 + 49297 + i) % (i + 1)
        out[i], out[j] = out[j], out[i]
    return out


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
    options = _shuffle_stable([correct, *distractors[:3]], seed)
    if correct not in options:
        return None
    return GeneratedQuestion(
        question=question.strip(),
        options=options,
        correct_answer=options.index(correct),
        explanation=explanation,
    )


def _heuristic_subject_question(title: str, content: str) -> GeneratedQuestion | None:
    parts = re.split(r"(?<=[.!?])\s+", _strip_markdown_noise(content))
    first = parts[0].strip() if parts else ""
    summary = first[:160] if len(first) > 20 else f"An overview of {title}"
    return _make_mcq(
        f'What is the primary subject of "{title}"?',
        summary,
        _generic_distractors(0),
        "The article's title and opening sentences establish its primary subject.",
        0,
    )


def _heuristic_fill_blank_questions(
    sentences: list[str],
    key_terms: list[str],
) -> list[GeneratedQuestion]:
    out: list[GeneratedQuestion] = []
    for i, sentence in enumerate(sentences):
        for term in key_terms:
            if term.lower() not in sentence.lower():
                continue
            masked = re.sub(re.escape(term), "____", sentence, count=1, flags=re.I)
            if masked == sentence:
                continue
            distractors = [t for t in key_terms if t.lower() != term.lower()][:3]
            while len(distractors) < 3:
                distractors.extend(_generic_distractors(i + len(distractors)))
                distractors = _dedupe_preserve(distractors)
            q = _make_mcq(
                f"Fill in the blank: {masked[:220]}",
                term,
                distractors,
                f'The article states: "{sentence.strip()[:200]}"',
                i + len(out),
            )
            if q:
                out.append(q)
    return out


def _heuristic_statement_questions(sentences: list[str]) -> list[GeneratedQuestion]:
    out: list[GeneratedQuestion] = []
    for i, sentence in enumerate(sentences):
        correct = sentence[:140]
        q = _make_mcq(
            "According to the article, which statement is most accurate?",
            correct,
            _other_sentence_distractors(sentences, i, i) if len(sentences) > 1 else _generic_distractors(i),
            f"Taken from the article: \"{sentence.strip()[:200]}\"",
            i + 11,
        )
        if q:
            out.append(q)
    return out


def _heuristic_heading_questions(headings: list[str], key_terms: list[str]) -> list[GeneratedQuestion]:
    out: list[GeneratedQuestion] = []
    for i, heading in enumerate(headings):
        distractors = [h for h in headings if h != heading][:3]
        if len(distractors) < 3:
            distractors.extend(t for t in key_terms if t.lower() != heading.lower())
        distractors = _dedupe_preserve(distractors)[:3]
        while len(distractors) < 3:
            distractors.extend(_generic_distractors(i + len(distractors)))
            distractors = _dedupe_preserve(distractors)
        q = _make_mcq(
            "Which section heading appears in this article?",
            heading,
            distractors[:3],
            f"The article includes a section titled \"{heading}\".",
            i + 23,
        )
        if q:
            out.append(q)
    return out


def _heuristic_bullet_questions(bullets: list[str], sentences: list[str]) -> list[GeneratedQuestion]:
    out: list[GeneratedQuestion] = []
    for i, bullet in enumerate(bullets):
        correct = bullet[:140]
        pool = [b[:140] for j, b in enumerate(bullets) if j != i]
        pool.extend(s[:140] for s in sentences if s[:140] != correct)
        distractors = _dedupe_preserve(pool)[:3]
        while len(distractors) < 3:
            distractors.extend(_generic_distractors(i + len(distractors)))
            distractors = _dedupe_preserve(distractors)
        q = _make_mcq(
            "Which point is made in the article?",
            correct,
            distractors[:3],
            f"The article lists: \"{bullet.strip()[:200]}\"",
            i + 37,
        )
        if q:
            out.append(q)
    return out


def _heuristic_code_questions(code_blocks: list[tuple[str | None, str]]) -> list[GeneratedQuestion]:
    out: list[GeneratedQuestion] = []
    for i, (lang, code) in enumerate(code_blocks):
        preview = "\n".join(code.splitlines()[:4]).strip()
        if lang:
            correct = f"A {lang} code example from the article"
            distractors = [
                "A shell script not shown in the article",
                "A SQL migration unrelated to the content",
                "A configuration file the article does not include",
            ]
            explanation = f"The article includes a {lang} code block."
        else:
            correct = preview[:120] if preview else "A code example from the article"
            distractors = _generic_distractors(i)
            explanation = "The article includes a code example matching this snippet."
        q = _make_mcq(
            "Which code-related content appears in the article?",
            correct,
            distractors,
            explanation,
            i + 51,
        )
        if q:
            out.append(q)
    return out


def _heuristic_term_context_questions(sentences: list[str], key_terms: list[str]) -> list[GeneratedQuestion]:
    out: list[GeneratedQuestion] = []
    for i, term in enumerate(key_terms):
        matches = [s for s in sentences if term.lower() in s.lower()]
        if not matches:
            continue
        sentence = matches[i % len(matches)]
        correct = sentence[:140]
        distractors = _other_sentence_distractors(sentences, sentences.index(sentence), i)
        q = _make_mcq(
            f'In what context does the article mention "{term}"?',
            correct,
            distractors,
            f"\"{term}\" appears in: \"{sentence.strip()[:200]}\"",
            i + 67,
        )
        if q:
            out.append(q)
    return out


def _heuristic_negative_term_questions(key_terms: list[str], content: str) -> list[GeneratedQuestion]:
    out: list[GeneratedQuestion] = []
    content_lower = content.lower()
    absent = [t for t in key_terms if t.lower() not in content_lower]
    present = [t for t in key_terms if t.lower() in content_lower]
    if not present:
        return out
    fake_terms = ["Kubernetes", "GraphQL", "Terraform", "Redis", "Elasticsearch", "Docker Swarm"]
    for i, fake in enumerate(fake_terms):
        if fake.lower() in content_lower:
            continue
        distractors = _shuffle_stable(present[:4], i)[:3]
        while len(distractors) < 3:
            distractors.append(present[len(distractors) % len(present)])
        q = _make_mcq(
            "Which term is NOT discussed in the article?",
            fake,
            distractors[:3],
            f"\"{fake}\" does not appear as a topic in this article.",
            i + 79,
        )
        if q:
            out.append(q)
        if len(out) >= max(4, len(absent)):
            break
    return out


def _heuristic_variation_questions(
    title: str,
    sentences: list[str],
    key_terms: list[str],
    start_index: int,
    needed: int,
) -> list[GeneratedQuestion]:
    templates = [
        ("Which option best reflects a claim made in \"{title}\"?", lambda s: s[:140]),
        ("The article implies that:", lambda s: s[:140]),
        ("Which idea is supported by the article?", lambda s: s[:140]),
        ("Which summary matches the article's discussion of {term}?", lambda s: s[:140]),
    ]
    out: list[GeneratedQuestion] = []
    idx = start_index
    while len(out) < needed:
        if not sentences and not key_terms:
            break
        template, formatter = templates[idx % len(templates)]
        sentence = sentences[idx % len(sentences)] if sentences else title
        term = key_terms[idx % len(key_terms)] if key_terms else title
        question = template.format(title=title, term=term)
        correct = formatter(sentence)
        distractors = _other_sentence_distractors(sentences, idx % max(1, len(sentences)), idx) if len(sentences) > 1 else _generic_distractors(idx)
        q = _make_mcq(
            question,
            correct,
            distractors,
            f"Variation based on article content near item {idx + 1}.",
            idx + 101,
        )
        if q:
            out.append(q)
        idx += 1
        if idx > start_index + needed * 4:
            break
    return out


def _collect_heuristic_candidates(title: str, content: str) -> list[GeneratedQuestion]:
    sentences = _split_sentences(content)
    key_terms = _extract_key_terms(content)
    headings = _extract_headings(content)
    bullets = _extract_bullets(content)
    code_blocks = _extract_code_blocks(content)

    candidates: list[GeneratedQuestion] = []
    subject = _heuristic_subject_question(title, content)
    if subject:
        candidates.append(subject)
    candidates.extend(_heuristic_fill_blank_questions(sentences, key_terms))
    candidates.extend(_heuristic_statement_questions(sentences))
    candidates.extend(_heuristic_heading_questions(headings, key_terms))
    candidates.extend(_heuristic_bullet_questions(bullets, sentences))
    candidates.extend(_heuristic_code_questions(code_blocks))
    candidates.extend(_heuristic_term_context_questions(sentences, key_terms))
    candidates.extend(_heuristic_negative_term_questions(key_terms, content))
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
            return out[:count]

    variations = _heuristic_variation_questions(
        title,
        _split_sentences(content),
        _extract_key_terms(content),
        len(out),
        count - len(out),
    )
    for q in variations:
        if q.question in seen:
            continue
        seen.add(q.question)
        out.append(q)
        if len(out) >= count:
            break

    return out[:count]
