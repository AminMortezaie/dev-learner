import { useParams, Link } from "wouter";
import {
  useListLanguages,
  useListTopics,
  getListTopicsQueryKey,
} from "@devlearn/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Library, BrainCircuit, ArrowRight, Code2 } from "lucide-react";
import { getLanguageColor, getLanguageIcon } from "@/shared/config/languages";

export default function LanguageHub() {
  const { slug } = useParams<{ slug: string }>();

  const { data: languages, isLoading: langsLoading } = useListLanguages();
  const language = languages?.find(l => l.slug === slug);
  const langId = language?.id;

  const topicsParams = { languageId: langId };
  const { data: topics, isLoading: topicsLoading } = useListTopics(
    topicsParams,
    { query: { queryKey: getListTopicsQueryKey(topicsParams), enabled: !!langId } },
  );

  if (langsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!language) {
    return <div className="text-center py-20 text-muted-foreground">Language track not found.</div>;
  }

  const Icon = getLanguageIcon(slug!);
  const colorClass = getLanguageColor(slug!);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="p-4 md:p-8 rounded-2xl border border-border bg-card/30 backdrop-blur flex flex-col sm:flex-row items-start gap-4 md:gap-6">
        <div className={`p-3 md:p-4 rounded-xl bg-background/50 border border-border shrink-0 ${colorClass}`}>
          <Icon className="h-8 w-8 md:h-12 md:w-12" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{language.name}</h1>
          <p className="text-muted-foreground max-w-2xl">{language.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href={`/syntax/${slug}`}>
          <Card className="hover:border-primary/50 cursor-pointer transition-colors bg-card/50">
            <CardHeader className="pb-2">
              <Code2 className="h-6 w-6 mb-2 text-primary" />
              <CardTitle className="text-lg">Syntax & Semantics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Learn core language constructs with real-world examples.</p>
              <div className="text-xs font-mono text-primary flex items-center">
                Explore Track <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href={`/topics?lang=${language.id}`}>
          <Card className="hover:border-primary/50 cursor-pointer transition-colors bg-card/50">
            <CardHeader className="pb-2">
              <Layers className="h-6 w-6 mb-2 text-primary" />
              <CardTitle className="text-lg">Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Deep dive into specific concepts and patterns.</p>
              <div className="text-xs font-mono text-primary flex items-center">
                View Topics <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href={`/resources?lang=${language.id}`}>
          <Card className="hover:border-primary/50 cursor-pointer transition-colors bg-card/50">
            <CardHeader className="pb-2">
              <Library className="h-6 w-6 mb-2 text-primary" />
              <CardTitle className="text-lg">Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Curated articles, videos, and external guides.</p>
              <div className="text-xs font-mono text-primary flex items-center">
                Browse Library <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href={`/quizzes?lang=${language.id}`}>
          <Card className="hover:border-primary/50 cursor-pointer transition-colors bg-card/50">
            <CardHeader className="pb-2">
              <BrainCircuit className="h-6 w-6 mb-2 text-primary" />
              <CardTitle className="text-lg">Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Test your knowledge and identify knowledge gaps.</p>
              <div className="text-xs font-mono text-primary flex items-center">
                Test Yourself <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-mono">/recent-topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topicsLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
          ) : topics?.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
              No topics available for this track yet.
            </div>
          ) : (
            topics?.slice(0, 6).map((topic) => (
              <Card key={topic.id} className="bg-card/30 backdrop-blur">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={topic.difficulty === 'advanced' ? 'destructive' : topic.difficulty === 'intermediate' ? 'default' : 'secondary'} className="text-xs">
                      {topic.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{topic.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{topic.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}