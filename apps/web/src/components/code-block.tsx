import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Maximize2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const LANG_MAP: Record<string, string> = {
  java: "java",
  kotlin: "kotlin",
  go: "go",
  golang: "go",
  python: "python",
  py: "python",
  ts: "typescript",
  typescript: "typescript",
  js: "javascript",
  javascript: "javascript",
  sql: "sql",
  bash: "bash",
  sh: "bash",
  yaml: "yaml",
  json: "json",
  "system-design": "text",
};

function useResolvedTheme() {
  const { theme } = useTheme();
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

interface CodeBlockProps {
  code: string;
  language?: string;
  label?: string;
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function Highlighter({ code, language, fontSize = "0.8125rem" }: { code: string; language: string; fontSize?: string }) {
  const resolvedTheme = useResolvedTheme();
  const style = resolvedTheme === "dark" ? vscDarkPlus : vs;
  const lang = LANG_MAP[language.toLowerCase()] ?? "text";

  return (
    <SyntaxHighlighter
      language={lang}
      style={style}
      customStyle={{
        margin: 0,
        borderRadius: 0,
        fontSize,
        lineHeight: "1.6",
        overflowX: "auto",
      }}
      codeTagProps={{ style: { fontFamily: "ui-monospace, monospace" } }}
    >
      {code}
    </SyntaxHighlighter>
  );
}

export function CodeBlock({ code, language = "text", label }: CodeBlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="group relative cursor-pointer"
        onClick={() => setOpen(true)}
        title="Click to expand"
      >
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton code={code} />
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Highlighter code={code} language={language} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="font-mono text-sm">
              {label ?? language}
            </DialogTitle>
            <CopyButton code={code} />
          </DialogHeader>
          <div className="overflow-auto flex-1">
            <Highlighter code={code} language={language} fontSize="0.875rem" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
