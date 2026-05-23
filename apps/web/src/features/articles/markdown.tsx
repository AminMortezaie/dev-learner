import React from "react";
import { CodeBlock } from "@/components/code-block";
import { renderInline } from "./markdown-inline";
import { MarkdownTable } from "./markdown-table";

function isBulletLine(line: string): boolean {
  const t = line.trimStart();
  return t.startsWith("- ") || t.startsWith("* ");
}

function isOrderedLine(line: string): boolean {
  return /^\s*\d+\. /.test(line);
}

function stripBullet(line: string): string {
  return line.trimStart().replace(/^[-*] /, "").replace(/^\d+\. /, "");
}

/** Split a pipe table row into cells (GFM-style). */
function parseTableCells(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return [];
  let inner = trimmed;
  if (inner.startsWith("|")) inner = inner.slice(1);
  if (inner.endsWith("|")) inner = inner.slice(0, -1);
  return inner.split("|").map((c) => c.trim());
}

function isTableSeparatorRow(line: string): boolean {
  const cells = parseTableCells(line);
  if (cells.length < 2) return false;
  return cells.every((c) => /^:?-{3,}:?$/.test(c.replace(/\s/g, "")));
}

function isTableRow(line: string): boolean {
  return parseTableCells(line).length >= 2;
}

function isSingleHashComment(line: string): boolean {
  const t = line.trimStart();
  return /^#(?!\#)\s/.test(t);
}

function isUnfencedCodeLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed === "") return false;
  if (/^#{2,6}\s/.test(trimmed)) return false;
  if (trimmed.startsWith("```")) return false;
  if (trimmed.startsWith("> ")) return false;
  if (isTableRow(line)) return false;
  if (isBulletLine(line)) return false;
  if (isOrderedLine(line)) return false;
  if (isSingleHashComment(line)) return true;
  if (/^\s{4,}\S/.test(line)) return true;
  if (
    /^(import |from \S+ import |def |class |if __name__|print\(|return\b|for\b|while\b|elif\b|else:|try:|except\b|with\b|async def )/.test(
      trimmed,
    )
  ) {
    return true;
  }
  if (/^[a-zA-Z_]\w*\s*=/.test(trimmed)) return true;
  if (/^[a-zA-Z_]\w*\(\)/.test(trimmed)) return true;
  return false;
}

function consumeUnfencedCodeBlock(lines: string[], startIndex: number): { codeLines: string[]; nextIndex: number } {
  const codeLines: string[] = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (trimmed === "") {
      let j = i + 1;
      while (j < lines.length && lines[j]!.trim() === "") j++;
      if (j < lines.length && isUnfencedCodeLine(lines[j]!)) {
        codeLines.push(line);
        i++;
        continue;
      }
      break;
    }

    if (!isUnfencedCodeLine(line)) break;
    codeLines.push(line);
    i++;
  }

  while (codeLines.length > 0 && codeLines[codeLines.length - 1]!.trim() === "") {
    codeLines.pop();
  }

  return { codeLines, nextIndex: i };
}

export function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let paraLines: string[] = [];

  const key = (prefix: string) => `${prefix}-${elements.length}-${i}`;

  const flushPara = () => {
    if (paraLines.length === 0) return;
    const text = paraLines.join(" ").trim();
    if (text) elements.push(<p key={key("p")}>{renderInline(text)}</p>);
    paraLines = [];
  };

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (trimmed === "") {
      flushPara();
      i++;
      continue;
    }

    if (/^[-=]{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      flushPara();
      elements.push(<hr key={key("hr")} className="my-6 border-border" />);
      i++;
      continue;
    }

    if (line.startsWith("##### ")) {
      flushPara();
      elements.push(<h5 key={key("h")}>{renderInline(line.slice(6))}</h5>);
      i++;
      continue;
    }
    if (line.startsWith("#### ")) {
      flushPara();
      elements.push(<h4 key={key("h")}>{renderInline(line.slice(5))}</h4>);
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      flushPara();
      elements.push(<h3 key={key("h")}>{renderInline(line.slice(4))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      flushPara();
      elements.push(<h2 key={key("h")}>{renderInline(line.slice(3))}</h2>);
      i++;
      continue;
    }
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      if (elements.length === 0 && paraLines.length === 0) {
        flushPara();
        elements.push(<h1 key={key("h")}>{renderInline(line.slice(2))}</h1>);
        i++;
        continue;
      }
    }

    if (trimmed.startsWith("```")) {
      flushPara();
      const lang = trimmed.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trimStart().startsWith("```")) {
        codeLines.push(lines[i]!);
        i++;
      }
      i++;
      elements.push(
        <div key={key("code")} className="rounded-lg overflow-hidden border border-border my-4">
          <CodeBlock code={codeLines.join("\n")} language={lang} />
        </div>,
      );
      continue;
    }

    if (isUnfencedCodeLine(line)) {
      flushPara();
      const { codeLines, nextIndex } = consumeUnfencedCodeBlock(lines, i);
      if (codeLines.length > 0) {
        elements.push(
          <div key={key("code")} className="rounded-lg overflow-hidden border border-border my-4">
            <CodeBlock code={codeLines.join("\n")} language="python" />
          </div>,
        );
      }
      i = nextIndex;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushPara();
      const qLines: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith("> ")) {
        qLines.push(lines[i]!.trim().slice(2));
        i++;
      }
      elements.push(
        <blockquote key={key("bq")}>
          {qLines.map((l, j) => (
            <p key={j}>{renderInline(l)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    if (isTableRow(line)) {
      flushPara();
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i]!)) {
        tableLines.push(lines[i]!);
        i++;
      }
      if (tableLines.length >= 2 && isTableSeparatorRow(tableLines[1]!)) {
        const header = parseTableCells(tableLines[0]!);
        const body = tableLines.slice(2).map(parseTableCells);
        elements.push(<MarkdownTable key={key("table")} header={header} rows={body} />);
      } else {
        const rows = tableLines.map(parseTableCells);
        const header = rows[0] ?? [];
        const body = rows.slice(1);
        elements.push(<MarkdownTable key={key("table")} header={header} rows={body} />);
      }
      continue;
    }

    if (isBulletLine(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && isBulletLine(lines[i]!)) {
        items.push(stripBullet(lines[i]!));
        i++;
      }
      elements.push(
        <ul key={key("ul")}>
          {items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (isOrderedLine(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && isOrderedLine(lines[i]!)) {
        items.push(stripBullet(lines[i]!));
        i++;
      }
      elements.push(
        <ol key={key("ol")}>
          {items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    paraLines.push(line);
    i++;
  }

  flushPara();
  return elements;
}
