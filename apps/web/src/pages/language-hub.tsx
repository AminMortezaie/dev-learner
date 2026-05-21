import type { ComponentType } from "react";
import { useParams, Link } from "wouter";
import {
  useListLanguages,
  useListTopics,
  getListTopicsQueryKey,
} from "@devlearn/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Library, BrainCircuit, ArrowRight, Code2, Hammer } from "lucide-react";
import { getLanguageColor, getLanguageIcon } from "@/shared/config/languages";

type HubFeatureCardProps = {
  href: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: string;
};

function HubFeatureCard({ href, icon: Icon, title, description, cta }: HubFeatureCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full flex flex-col hover:border-primary/50 cursor-pointer transition-colors bg-card/50">
        <CardHeader className="pb-2">
          <Icon className="h-6 w-6 mb-2 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <p className="text-sm text-muted-foreground flex-1 min-h-[3.5rem]">{description}</p>
          <div className="text-xs font-mono text-primary flex items-center mt-4">
            {cta} <ArrowRight className="ml-1 h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

const hubFeatures = (slug: string, languageId: number) => [
  {
    href: `/syntax/${slug}`,
    icon: Code2,
    title: "Syntax & Semantics",
    description: "Learn core language constructs with real-world examples.",
    cta: "Explore Track",
  },
  {
    href: `/projects/${slug}`,
    icon: Hammer,
    title: "Build Projects",
    description: "Zero-to-hero build guides with step-by-step code snippets.",
    cta: "Start Building",
  },
  {
    href: `/topics?lang=${languageId}`,
    icon: Layers,
    title: "Topics",
    description: "Deep dive into specific concepts and patterns.",
    cta: "View Topics",
  },
  {
    href: `/resources?lang=${languageId}`,
    icon: Library,
    title: "Resources",
    description: "Curated articles, videos, and external guides.",
    cta: "Browse Library",
  },
  {
    href: `/quizzes?lang=${languageId}`,
    icon: BrainCircuit,
    title: "Quizzes",
    description: "Test your knowledge and identify knowledge gaps.",
    cta: "Test Yourself",
  },
];

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
        {hubFeatures(slug!, language.id).map((feature) => (
          <HubFeatureCard key={feature.href} {...feature} />
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-mono">/recent-topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {topicsLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
          ) : topics?.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
              No topics available for this track yet.
            </div>
          ) : (
            topics?.slice(0, 6).map((topic) => (
              <Card key={topic.id} className="h-full flex flex-col bg-card/30 backdrop-blur">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={topic.difficulty === 'advanced' ? 'destructive' : topic.difficulty === 'intermediate' ? 'default' : 'secondary'} className="text-xs">
                      {topic.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{topic.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">{topic.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}