import React from "react";
import { CodeBlock } from "@/components/code-block";

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|(?<!\*)\*(?!\*)[^*]+(?<!\*)\*(?!\*)|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2 && !part.startsWith("**")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

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
    if (line.startsWith("# ")) {
      flushPara();
      elements.push(<h1 key={key("h")}>{renderInline(line.slice(2))}</h1>);
      i++;
      continue;
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
