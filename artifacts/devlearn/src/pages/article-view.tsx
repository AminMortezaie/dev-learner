import React from "react";
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
import { ArrowLeft, BrainCircuit, Calendar, Tag } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

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
        
        <h1 className="text-4xl font-bold tracking-tight">{article.title}</h1>
        
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground font-mono mt-4">
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
      </div>

      <div className="prose dark:prose-invert prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-border max-w-none">
        {renderMarkdown(article.content)}
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