import { useState } from "react";
import { useListQuizzes, useListLanguages, getListQuizzesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrainCircuit, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Quizzes() {
  const [selectedLang, setSelectedLang] = useState<string>("all");

  const { data: languages } = useListLanguages();
  
  const params: any = {};
  if (selectedLang !== "all") params.languageId = parseInt(selectedLang);

  const { data: quizzes, isLoading } = useListQuizzes(params);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">/quizzes</h1>
          <p className="text-muted-foreground">Test your knowledge across different languages and topics.</p>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={selectedLang} onValueChange={setSelectedLang}>
          <SelectTrigger className="w-[200px] font-mono">
            <SelectValue placeholder="Filter by Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages?.map((lang) => (
              <SelectItem key={lang.id} value={lang.id.toString()}>{lang.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : quizzes?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg">
            No quizzes found.
          </div>
        ) : (
          quizzes?.map((quiz) => (
            <Link key={quiz.id} href={`/quizzes/${quiz.id}`}>
              <Card className="h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors cursor-pointer flex flex-col group">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    {quiz.languageName && <Badge variant="outline" className="font-mono text-xs">{quiz.languageName}</Badge>}
                  </div>
                  <CardTitle className="text-xl flex items-center group-hover:text-primary transition-colors">
                    <BrainCircuit className="mr-2 h-5 w-5" /> {quiz.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2">{quiz.description}</p>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between items-center text-sm font-mono text-muted-foreground">
                  <div className="text-xs">
                    {quiz.questionCount || 0} questions
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}