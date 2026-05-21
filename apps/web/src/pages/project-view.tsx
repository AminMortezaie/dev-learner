import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetProjectBySlug,
  getGetProjectBySlugQueryKey,
} from "@devlearn/api-client";
import type { ProjectSnippet } from "@devlearn/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CodeBlock } from "@/components/code-block";
import { renderMarkdown } from "@/features/articles/markdown";
import {
  getCompletedSteps,
  markStepComplete,
  clearProjectProgress,
} from "@/shared/projects/progress";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  FileCode2,
} from "lucide-react";

function SnippetBlock({
  snippet,
  codeLanguage,
}: {
  snippet: ProjectSnippet;
  codeLanguage: string;
}) {
  const actionLabel =
    snippet.action === "create" ? "Create" : snippet.action === "modify" ? "Modify" : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-primary flex items-center gap-1.5">
          <FileCode2 className="h-3.5 w-3.5" />
          {snippet.path}
        </span>
        {actionLabel && (
          <Badge variant="outline" className="font-mono text-[10px]">
            {actionLabel}
          </Badge>
        )}
        {snippet.label && (
          <span className="text-xs text-muted-foreground">{snippet.label}</span>
        )}
      </div>
      <div className="rounded-lg overflow-hidden border border-border">
        <CodeBlock code={snippet.code} language={codeLanguage} label={snippet.path} />
      </div>
    </div>
  );
}

export default function ProjectView() {
  const { languageSlug, projectSlug } = useParams<{
    languageSlug: string;
    projectSlug: string;
  }>();

  const { data: project, isLoading } = useGetProjectBySlug(languageSlug!, projectSlug!, {
    query: {
      queryKey: getGetProjectBySlugQueryKey(languageSlug!, projectSlug!),
      enabled: !!languageSlug && !!projectSlug,
    },
  });

  const steps = useMemo(
    () => [...(project?.steps ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
    [project?.steps],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const currentStep = steps[stepIndex];

  useEffect(() => {
    if (project?.id) {
      setCompleted(getCompletedSteps(project.id));
    }
  }, [project?.id]);

  useEffect(() => {
    setStepIndex(0);
  }, [project?.id]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project || steps.length === 0) {
    return <div className="text-center py-20 text-muted-foreground">Project not found.</div>;
  }

  const progressPct = ((completed.length / steps.length) * 100) || 0;
  const isStepDone = completed.includes(stepIndex);

  const handleMarkComplete = () => {
    const next = markStepComplete(project.id, stepIndex);
    setCompleted(next);
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="outline" className="font-mono">
            {project.languageName}
          </Badge>
          <Badge variant="secondary" className="font-mono text-xs">
            {project.difficulty}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {steps.length} steps
          </Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-mono mb-2">
          {project.title}
        </h1>
        <p className="text-muted-foreground">{project.description}</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono text-muted-foreground">
          <span>
            Progress: {completed.length}/{steps.length} steps
          </span>
          <button
            type="button"
            className="hover:text-foreground transition-colors"
            onClick={() => {
              clearProjectProgress(project.id);
              setCompleted([]);
            }}
          >
            Reset progress
          </button>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map((step, i) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setStepIndex(i)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
              i === stepIndex
                ? "bg-primary/15 border-primary text-primary"
                : completed.includes(i)
                  ? "border-green-500/40 text-green-600 dark:text-green-400"
                  : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {i + 1}. {step.title}
          </button>
        ))}
      </div>

      <Card className="bg-card/50 backdrop-blur border-primary/10">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-mono">
                Step {stepIndex + 1}: {currentStep.title}
              </CardTitle>
              <CardDescription className="mt-1 font-medium text-foreground/80">
                Goal: {currentStep.goal}
              </CardDescription>
            </div>
            {isStepDone && (
              <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 font-mono gap-1">
                <CheckCircle2 className="h-3 w-3" /> Done
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            {renderMarkdown(currentStep.instructions)}
          </div>

          {currentStep.snippets.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                  Code for this step
                </span>
                {project.playgroundUrl && (
                  <Button variant="outline" size="sm" className="font-mono text-xs" asChild>
                    <a href={project.playgroundUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Open playground
                    </a>
                  </Button>
                )}
              </div>
              {currentStep.snippets.map((snippet, idx) => (
                <SnippetBlock
                  key={`${snippet.path}-${idx}`}
                  snippet={snippet}
                  codeLanguage={project.codeLanguage}
                />
              ))}
              <p className="text-xs text-muted-foreground font-mono">
                Copy snippets into your local project. Run and iterate in your own editor or an
                external playground.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
            <Button
              variant="ghost"
              className="font-mono"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex(stepIndex - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <div className="flex gap-2">
              {!isStepDone && (
                <Button className="font-mono" onClick={handleMarkComplete}>
                  Mark complete
                </Button>
              )}
              {stepIndex < steps.length - 1 ? (
                <Button
                  variant="secondary"
                  className="font-mono"
                  onClick={() => setStepIndex(stepIndex + 1)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Link href={`/projects/${languageSlug}`}>
                  <Button variant="secondary" className="font-mono">
                    Back to projects
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
