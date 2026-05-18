import { useParams, useLocation } from "wouter";
import { useGetArticle, useGetArticleQuiz } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BrainCircuit, Calendar, Tag } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ArticleView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: article, isLoading } = useGetArticle(parseInt(id!), {
    query: { enabled: !!id }
  });

  const getQuiz = useGetArticleQuiz(parseInt(id!), {
    query: { enabled: false }
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

      <div className="prose prose-invert prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-border max-w-none">
        {/* Very basic markdown rendering for demonstration since we don't have react-markdown installed in scaffold */}
        {article.content.split('\n\n').map((paragraph, idx) => {
          if (paragraph.startsWith('# ')) {
            return <h1 key={idx}>{paragraph.substring(2)}</h1>;
          }
          if (paragraph.startsWith('## ')) {
            return <h2 key={idx}>{paragraph.substring(3)}</h2>;
          }
          if (paragraph.startsWith('### ')) {
            return <h3 key={idx}>{paragraph.substring(4)}</h3>;
          }
          if (paragraph.startsWith('```')) {
            const lines = paragraph.split('\n');
            const code = lines.slice(1, lines.length - 1).join('\n');
            return (
              <pre key={idx} className="p-4 rounded-lg bg-black font-mono text-sm overflow-x-auto border border-border">
                <code>{code}</code>
              </pre>
            );
          }
          return <p key={idx}>{paragraph}</p>;
        })}
      </div>

      <div className="mt-16 p-8 border border-border bg-card/50 rounded-xl text-center">
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