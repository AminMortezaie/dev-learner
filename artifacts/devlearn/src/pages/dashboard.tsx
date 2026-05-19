import { useGetDashboardStats, useGetLanguageProgress, useGetRecentActivity, useListLanguages } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Layers, Library, BookOpen, BrainCircuit, Code2, Coffee, Cpu, Network, Terminal, Workflow } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const languageIcons: Record<string, any> = {
  "system-design": Network,
  "java": Coffee,
  "kotlin": Workflow,
  "golang": Cpu,
  "python": Terminal
};

const languageColors: Record<string, string> = {
  "system-design": "text-slate-400",
  "java": "text-orange-500",
  "kotlin": "text-purple-500",
  "golang": "text-teal-400",
  "python": "text-blue-400"
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: languages, isLoading: langsLoading } = useListLanguages();
  const { data: progress, isLoading: progressLoading } = useGetLanguageProgress();
  const { data: recent, isLoading: recentLoading } = useGetRecentActivity();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 font-mono">/dashboard</h1>
        <p className="text-muted-foreground">Welcome back. Here is your learning overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Topics" value={stats?.totalTopics} icon={Layers} loading={statsLoading} />
        <StatCard title="Resources" value={stats?.totalResources} icon={Library} loading={statsLoading} />
        <StatCard title="Articles" value={stats?.totalArticles} icon={BookOpen} loading={statsLoading} />
        <StatCard title="Quizzes" value={stats?.totalQuizzes} icon={BrainCircuit} loading={statsLoading} />
        <StatCard title="Syntax" value={stats?.totalSyntaxLessons} icon={Code2} loading={statsLoading} />
        <StatCard title="Languages" value={stats?.totalLanguages} icon={Layers} loading={statsLoading} />
      </div>

      {/* Learning Tracks */}
      <div>
        <h2 className="text-xl font-bold mb-4 font-mono">/tracks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {langsLoading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-40" />)
          ) : (
            languages?.map((lang) => {
              const Icon = languageIcons[lang.slug] || Code2;
              const colorClass = languageColors[lang.slug] || "text-primary";
              
              return (
                <Link key={lang.id} href={`/language/${lang.slug}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer bg-card/50 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-lg font-medium">{lang.name}</CardTitle>
                      <Icon className={`h-6 w-6 ${colorClass}`} />
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {lang.description}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground font-mono">
                        <span>{lang.topicCount || 0} topics</span>
                        <span>{lang.lessonCount || 0} syntax</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold mb-4 font-mono">/recent-activity</h2>
        {recentLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {recent?.articles?.map(article => (
              <Card key={`art-${article.id}`} className="bg-card/30 backdrop-blur">
                <CardHeader className="py-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-md shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{article.title}</span>
                    </div>
                    <Link href={`/articles/${article.id}`}>
                      <div className="cursor-pointer hover:underline text-xs text-muted-foreground shrink-0">View Article</div>
                    </Link>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {recent?.resources?.map(resource => (
              <Card key={`res-${resource.id}`} className="bg-card/30 backdrop-blur">
                <CardHeader className="py-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-md shrink-0">
                        <Library className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{resource.title}</span>
                    </div>
                    <a href={resource.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline shrink-0">
                      Visit Link
                    </a>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {recent?.quizzes?.map(quiz => (
              <Card key={`quiz-${quiz.id}`} className="bg-card/30 backdrop-blur">
                <CardHeader className="py-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-md shrink-0">
                        <BrainCircuit className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{quiz.title}</span>
                    </div>
                    <Link href={`/quizzes/${quiz.id}`}>
                      <div className="cursor-pointer hover:underline text-xs text-muted-foreground shrink-0">Take Quiz</div>
                    </Link>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading }: { title: string, value?: number, icon: any, loading: boolean }) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold font-mono">{value || 0}</div>
        )}
      </CardContent>
    </Card>
  );
}