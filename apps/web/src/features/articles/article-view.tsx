import { useParams, useLocation, Link } from "wouter";
import {
  useGetArticle,
  useGetArticleQuiz,
  getGetArticleQueryKey,
  getGetArticleQuizQueryKey,
} from "@devlearn/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BrainCircuit, Calendar, Tag, Volume2, Pause, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { renderMarkdown } from "./markdown";
import { useArticleTts } from "./use-article-tts";

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

  const {
    ttsState,
    activeSegIdx,
    contentSegments,
    segRefs,
    handleListen,
    handleSegmentClick,
    handleStop,
  } = useArticleTts(article?.title ?? "", article?.content ?? "");

  const handleGenerateQuiz = async () => {
    try {
      const quiz = await getQuiz.refetch();
      if (quiz.data) {
        toast({ title: "Quiz ready!" });
        setLocation(`/quizzes/${quiz.data.id}`);
      }
    } catch {
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
          <Volume2
            className={`h-4 w-4 ${ttsState === "playing" ? "text-primary animate-pulse" : "text-muted-foreground"}`}
          />
          <span className="text-xs font-mono text-muted-foreground">
            {ttsState === "playing" ? "Reading..." : "Paused"}
          </span>
          <div className="w-px h-4 bg-border mx-1" />
          <button onClick={handleListen} className="text-xs font-mono font-medium hover:text-primary transition-colors">
            {ttsState === "playing" ? "Pause" : "Resume"}
          </button>
          <button
            onClick={handleStop}
            className="text-xs font-mono text-muted-foreground hover:text-destructive transition-colors"
          >
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

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground font-mono">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              {new Date(article.createdAt!).toLocaleDateString()}
            </div>
            {article.tags && (
              <div className="flex items-center">
                <Tag className="mr-2 h-4 w-4" />
                {article.tags.split(",").map((t) => `#${t.trim()}`).join(" ")}
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
                <>
                  <Pause className="h-3.5 w-3.5" /> Pause
                </>
              ) : ttsState === "paused" ? (
                <>
                  <Volume2 className="h-3.5 w-3.5" /> Resume
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5" /> Listen
                </>
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
            ref={(el) => {
              segRefs.current[i] = el;
            }}
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
          {getQuiz.isFetching ? (
            "Generating Quiz..."
          ) : (
            <>
              <BrainCircuit className="mr-2 h-5 w-5" /> {article.hasQuiz ? "Go to Quiz" : "Generate Quiz"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
