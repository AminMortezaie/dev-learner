import React, { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetArticle,
  useGetArticleQuiz,
  getGetArticleQueryKey,
  getGetArticleQuizQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CodeBlock } from "@/components/code-block";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BrainCircuit, Calendar, Tag, Volume2, Pause, Square } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " code block. ")
    .replace(/`[^`]+`/g, (m) => m.slice(1, -1))
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/>\s?/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const eng = voices.filter(v => v.lang.startsWith("en"));
  const pool = eng.length ? eng : voices;
  return (
    pool.find(v => v.name === "Daniel") ??
    pool.find(v => v.name.toLowerCase().includes("daniel")) ??
    pool.find(v => v.name === "Samantha") ??
    pool.find(v => v.name.toLowerCase().includes("google")) ??
    pool[0] ?? null
  );
}

function renderInline(text: string): React.ReactNode {
  // Order matters: bold (**) before italic (*), then inline code
  const parts = text.split(/(\*\*[^*]+\*\*|(?<!\*)\*(?!\*)[^*]+(?<!\*)\*(?!\*)|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('**')) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={i}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function isBulletLine(line: string): boolean {
  const t = line.trimStart();
  return t.startsWith('- ') || t.startsWith('* ');
}

function isOrderedLine(line: string): boolean {
  return /^\s*\d+\. /.test(line);
}

function stripBullet(line: string): string {
  return line.trimStart().replace(/^[-*] /, '').replace(/^\d+\. /, '');
}

function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let paraLines: string[] = [];

  const key = (prefix: string) => `${prefix}-${elements.length}-${i}`;

  const flushPara = () => {
    if (paraLines.length === 0) return;
    const text = paraLines.join(' ').trim();
    if (text) elements.push(<p key={key('p')}>{renderInline(text)}</p>);
    paraLines = [];
  };

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (trimmed === '') {
      flushPara();
      i++;
      continue;
    }

    // Horizontal rule: --- or *** or ===== or long dashes (not a bullet point)
    if (/^[-=]{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      flushPara();
      elements.push(<hr key={key('hr')} className="my-6 border-border" />);
      i++;
      continue;
    }

    // Headings (#### h4 and ##### h5 too)
    if (line.startsWith('##### ')) {
      flushPara();
      elements.push(<h5 key={key('h')}>{renderInline(line.slice(6))}</h5>);
      i++; continue;
    }
    if (line.startsWith('#### ')) {
      flushPara();
      elements.push(<h4 key={key('h')}>{renderInline(line.slice(5))}</h4>);
      i++; continue;
    }
    if (line.startsWith('### ')) {
      flushPara();
      elements.push(<h3 key={key('h')}>{renderInline(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      flushPara();
      elements.push(<h2 key={key('h')}>{renderInline(line.slice(3))}</h2>);
      i++; continue;
    }
    if (line.startsWith('# ')) {
      flushPara();
      elements.push(<h1 key={key('h')}>{renderInline(line.slice(2))}</h1>);
      i++; continue;
    }

    // Code block
    if (trimmed.startsWith('```')) {
      flushPara();
      const lang = trimmed.slice(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trimStart().startsWith('```')) {
        codeLines.push(lines[i]!);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <div key={key('code')} className="rounded-lg overflow-hidden border border-border my-4">
          <CodeBlock code={codeLines.join('\n')} language={lang} />
        </div>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushPara();
      const qLines: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('> ')) {
        qLines.push(lines[i]!.trim().slice(2));
        i++;
      }
      elements.push(
        <blockquote key={key('bq')}>
          {qLines.map((l, j) => <p key={j}>{renderInline(l)}</p>)}
        </blockquote>
      );
      continue;
    }

    // Unordered list (handles indented bullets too)
    if (isBulletLine(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && isBulletLine(lines[i]!)) {
        items.push(stripBullet(lines[i]!));
        i++;
      }
      elements.push(
        <ul key={key('ul')}>
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (isOrderedLine(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && isOrderedLine(lines[i]!)) {
        items.push(stripBullet(lines[i]!));
        i++;
      }
      elements.push(
        <ol key={key('ol')}>
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ol>
      );
      continue;
    }

    paraLines.push(line);
    i++;
  }

  flushPara();
  return elements;
}

export default function ArticleView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const articleId = parseInt(id!);
  const { data: article, isLoading } = useGetArticle(articleId, {
    query: { queryKey: getGetArticleQueryKey(articleId), enabled: !!id },
  });

  const getQuiz = useGetArticleQuiz(articleId, {
    query: { queryKey: getGetArticleQuizQueryKey(articleId), enabled: false },
  });

  const [ttsState, setTtsState] = useState<"idle" | "playing" | "paused">("idle");
  const [activeSegIdx, setActiveSegIdx] = useState(-1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const segRefs = useRef<(HTMLDivElement | null)[]>([]);

  const contentSegments = article ? article.content.split(/\n\n+/).filter(s => s.trim()) : [];

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  // fromSegIdx: -1 = start from title, 0+ = start from that content segment
  const startTTS = (fromSegIdx: number) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const voice = pickVoice(synth.getVoices());
    const segTexts = contentSegments.map(s => stripMarkdownForSpeech(s)).filter(s => s.trim());
    const allParts: string[] = [article!.title, ...segTexts];
    const startIdx = fromSegIdx + 1; // +1 because idx 0 is the title

    const speakAt = (idx: number) => {
      if (idx >= allParts.length) {
        setTtsState("idle");
        setActiveSegIdx(-1);
        return;
      }

      const segIdx = idx - 1;
      setActiveSegIdx(segIdx);
      if (segIdx >= 0) {
        const el = segRefs.current[segIdx];
        if (el) {
          const { top, bottom } = el.getBoundingClientRect();
          const vh = window.innerHeight;
          if (top < 80 || bottom > vh - 80) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      } else {
        document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
      }

      const utt = new SpeechSynthesisUtterance(allParts[idx]!);
      if (voice) utt.voice = voice;
      utt.rate = 1.0;
      utt.pitch = 1.0;
      utt.onend = () => speakAt(idx + 1);
      utt.onerror = (e) => {
        const err = (e as SpeechSynthesisErrorEvent).error;
        if (err !== "canceled" && err !== "interrupted") {
          setTtsState("idle");
          setActiveSegIdx(-1);
        }
      };
      utteranceRef.current = utt;
      synth.speak(utt);
    };

    speakAt(startIdx);
    setTtsState("playing");
  };

  const handleListen = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (ttsState === "playing") { synth.pause(); setTtsState("paused"); return; }
    if (ttsState === "paused") { synth.resume(); setTtsState("playing"); return; }
    setActiveSegIdx(-1);
    startTTS(-1);
  };

  const handleSegmentClick = (segIdx: number) => {
    startTTS(segIdx);
  };

  const handleStop = () => {
    window.speechSynthesis?.cancel();
    setTtsState("idle");
    setActiveSegIdx(-1);
  };

  const handleGenerateQuiz = async () => {
    try {
      const quiz = await getQuiz.refetch();
      if (quiz.data) {
        toast({ title: "Quiz ready!" });
        setLocation(`/quizzes/${quiz.data.id}`);
      }
    } catch (e) {
      toast({ title: "Failed to generate quiz", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-4 mt-8">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-32 w-full mt-6" />
        </div>
      </div>
    );
  }

  if (!article) {
    return <div className="text-center py-20 text-muted-foreground">Article not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 pb-20">
      {ttsState !== "idle" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card/90 backdrop-blur shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Volume2 className={`h-4 w-4 ${ttsState === "playing" ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
          <span className="text-xs font-mono text-muted-foreground">{ttsState === "playing" ? "Reading..." : "Paused"}</span>
          <div className="w-px h-4 bg-border mx-1" />
          <button onClick={handleListen} className="text-xs font-mono font-medium hover:text-primary transition-colors">
            {ttsState === "playing" ? "Pause" : "Resume"}
          </button>
          <button onClick={handleStop} className="text-xs font-mono text-muted-foreground hover:text-destructive transition-colors">
            Stop
          </button>
        </div>
      )}
      <Link href="/articles">
        <Button variant="ghost" className="mb-6 -ml-4 font-mono text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
        </Button>
      </Link>

      <div className="space-y-4 mb-10 pb-10 border-b border-border">
        <div className="flex gap-2 items-center mb-4">
          {article.languageName && (
            <Badge variant="outline" className="font-mono bg-background">
              {article.languageName}
            </Badge>
          )}
          {article.hasQuiz && (
            <Badge variant="secondary" className="bg-primary/10 text-primary font-mono">
              Quiz Available
            </Badge>
          )}
        </div>
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">{article.title}</h1>
        
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground font-mono">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              {new Date(article.createdAt!).toLocaleDateString()}
            </div>
            {article.tags && (
              <div className="flex items-center">
                <Tag className="mr-2 h-4 w-4" />
                {article.tags.split(',').map(t => `#${t.trim()}`).join(' ')}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleListen}
              className={`font-mono gap-1.5 ${ttsState === "playing" ? "border-primary text-primary" : ""}`}
            >
              {ttsState === "playing" ? (
                <><Pause className="h-3.5 w-3.5" /> Pause</>
              ) : ttsState === "paused" ? (
                <><Volume2 className="h-3.5 w-3.5" /> Resume</>
              ) : (
                <><Volume2 className="h-3.5 w-3.5" /> Listen</>
              )}
            </Button>
            {ttsState !== "idle" && (
              <Button variant="ghost" size="sm" onClick={handleStop} className="font-mono gap-1.5 text-muted-foreground">
                <Square className="h-3 w-3 fill-current" /> Stop
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="prose prose-sm md:prose-base dark:prose-invert prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-border max-w-none">
        {contentSegments.map((seg, i) => (
          <div
            key={i}
            ref={el => { segRefs.current[i] = el; }}
            onClick={() => handleSegmentClick(i)}
            className={`transition-colors duration-300 rounded-md -mx-2 px-2 scroll-mt-20 cursor-pointer ${
              activeSegIdx === i
                ? "bg-yellow-400/20 dark:bg-yellow-400/15 ring-1 ring-yellow-400/40"
                : "hover:bg-muted/50"
            }`}
          >
            {renderMarkdown(seg)}
          </div>
        ))}
      </div>

      <div className="mt-16 p-4 md:p-8 border border-border bg-card/50 rounded-xl text-center">
        <h3 className="text-xl font-bold mb-2">Test Your Knowledge</h3>
        <p className="text-muted-foreground mb-6">
          Generate an interactive quiz based on the contents of this article to reinforce your learning.
        </p>
        <Button 
          onClick={handleGenerateQuiz} 
          disabled={getQuiz.isFetching}
          className="font-mono font-bold"
          size="lg"
        >
          {getQuiz.isFetching ? "Generating Quiz..." : (
            <><BrainCircuit className="mr-2 h-5 w-5" /> {article.hasQuiz ? "Go to Quiz" : "Generate Quiz"}</>
          )}
        </Button>
      </div>
    </div>
  );
}