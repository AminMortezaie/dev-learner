import { useParams, Link } from "wouter";
import {
  useListLanguages,
  useListProjects,
  getListProjectsQueryKey,
} from "@devlearn/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Hammer } from "lucide-react";
import { getLanguageColor, getLanguageIcon } from "@/shared/config/languages";

export default function ProjectsList() {
  const { languageSlug } = useParams<{ languageSlug: string }>();

  const { data: languages, isLoading: langsLoading } = useListLanguages();
  const language = languages?.find((l) => l.slug === languageSlug);
  const langId = language?.id;

  const projectsParams = { languageId: langId };
  const { data: projects, isLoading } = useListProjects(projectsParams, {
    query: {
      queryKey: getListProjectsQueryKey(projectsParams),
      enabled: !!langId,
    },
  });

  if (langsLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-16 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!language) {
    return <div className="text-center py-20 text-muted-foreground">Language track not found.</div>;
  }

  const Icon = getLanguageIcon(languageSlug!);
  const colorClass = getLanguageColor(languageSlug!);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-card border border-border shrink-0 ${colorClass}`}>
          <Icon className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono mb-2">
            /projects/{languageSlug}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Build real applications from scratch in a single file — step by step with an in-page
            editor.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : projects?.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border border-dashed rounded-xl">
          No build projects for this track yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {projects?.map((project) => (
            <Link key={project.id} href={`/projects/${languageSlug}/${project.slug}`}>
              <Card className="hover:border-primary/50 cursor-pointer transition-colors bg-card/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Hammer className="h-5 w-5 text-primary shrink-0" />
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs shrink-0">
                      {project.difficulty}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs font-mono text-primary">
                    <span>{project.stepCount ?? 0} steps · {project.codeLanguage}</span>
                    <span className="flex items-center">
                      Start building <ArrowRight className="ml-1 h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
