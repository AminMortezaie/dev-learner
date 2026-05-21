import { useState } from "react";
import { useParams } from "wouter";
import {
  useListLanguages,
  useListSyntaxLessons,
  getListSyntaxLessonsQueryKey,
} from "@devlearn/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, Code2, BookOpen } from "lucide-react";
import { CodeBlock } from "@/components/code-block";

export default function SyntaxLessons() {
  const { languageSlug } = useParams<{ languageSlug: string }>();

  const { data: languages, isLoading: langsLoading } = useListLanguages();
  const language = languages?.find(l => l.slug === languageSlug);
  const langId = language?.id;

  const lessonsParams = { languageId: langId };
  const { data: lessons, isLoading } = useListSyntaxLessons(
    lessonsParams,
    { query: { queryKey: getListSyntaxLessonsQueryKey(lessonsParams), enabled: !!langId } },
  );

  if (langsLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-16 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!language) {
    return <div className="text-center py-20 text-muted-foreground">Language track not found.</div>;
  }

  const groupedLessons = lessons?.reduce((acc, lesson) => {
    const diff = lesson.difficulty;
    if (!acc[diff]) acc[diff] = [];
    acc[diff].push(lesson);
    return acc;
  }, {} as Record<string, typeof lessons>);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-mono mb-2">/syntax/{languageSlug}</h1>
        <p className="text-muted-foreground">Master {language.name} through real-world examples and precise definitions.</p>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : lessons?.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
          No syntax lessons available yet for this track.
        </div>
      ) : (
        <div className="space-y-16">
          {['beginner', 'intermediate', 'advanced'].map(difficulty => {
            const diffLessons = groupedLessons?.[difficulty];
            if (!diffLessons || diffLessons.length === 0) return null;

            return (
              <div key={difficulty} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold font-mono uppercase text-muted-foreground tracking-wider">
                    {difficulty}
                  </h2>
                  <div className="h-px bg-border flex-1" />
                </div>

                <div className="space-y-8">
                  {diffLessons.map(lesson => (
                    <Card key={lesson.id} className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
                      <div className="flex flex-col md:flex-row border-b border-border/50 bg-muted/20">
                        <div className="p-4 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {lesson.category && <Badge variant="outline" className="font-mono text-[10px]">{lesson.category}</Badge>}
                          </div>
                          <CardTitle className="text-xl flex items-center">
                            <Code2 className="mr-2 h-5 w-5 text-primary" /> {lesson.title}
                          </CardTitle>
                          <p className="text-sm font-mono mt-2 text-muted-foreground">{lesson.concept}</p>
                        </div>
                        {lesson.explanation && (
                          <div className="p-4 flex-1 border-t md:border-t-0 md:border-l border-border/50 text-sm flex flex-col justify-center">
                            <div className="flex items-center text-xs font-mono text-muted-foreground mb-2">
                              <BookOpen className="mr-1.5 h-3 w-3" /> EXPLANATION
                            </div>
                            <p className="text-muted-foreground">{lesson.explanation}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
                        {lesson.rawSyntax && (
                          <div className="p-0">
                            <div className="px-4 py-2 border-b border-border/50 bg-black/40 text-xs font-mono text-muted-foreground">
                              SYNTAX
                            </div>
                            <div className="min-h-[120px]">
                              <CodeBlock code={lesson.rawSyntax} language={languageSlug} label="SYNTAX" />
                            </div>
                          </div>
                        )}
                        
                        {lesson.realWorldExample && (
                          <div className="p-0 flex flex-col">
                            <div className="px-4 py-2 border-b border-border/50 bg-black/40 text-xs font-mono text-muted-foreground flex justify-between items-center">
                              <span>REAL WORLD EXAMPLE</span>
                              {lesson.githubProject && (
                                <a href={lesson.githubUrl || "#"} target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors">
                                  <Github className="mr-1 h-3 w-3" /> {lesson.githubProject}
                                </a>
                              )}
                            </div>
                            <div className="min-h-[120px]">
                              <CodeBlock code={lesson.realWorldExample} language={languageSlug} label="REAL WORLD EXAMPLE" />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}