import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetQuiz, useSubmitQuizAttempt } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, BrainCircuit } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function QuizView() {
  const { id } = useParams<{ id: string }>();
  const quizId = parseInt(id!);

  const { data: quiz, isLoading } = useGetQuiz(quizId, {
    query: { enabled: !!id }
  });

  const submitAttempt = useSubmitQuizAttempt();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-24" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return <div className="text-center py-20 text-muted-foreground">Quiz not found or has no questions</div>;
  }

  const questions = quiz.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleSelectAnswer = (optionIndex: number) => {
    if (submitted) return;
    setAnswers({ ...answers, [currentQuestion.id]: optionIndex });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    const formattedAnswers = Object.entries(answers).map(([qId, selected]) => ({
      questionId: parseInt(qId),
      selectedAnswer: selected
    }));

    submitAttempt.mutate(
      { id: quizId, data: { answers: formattedAnswers } },
      {
        onSuccess: (data) => {
          setResult(data);
          setSubmitted(true);
        }
      }
    );
  };

  if (submitted && result) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
        <Link href="/quizzes">
          <Button variant="ghost" className="mb-6 -ml-4 font-mono text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Quizzes
          </Button>
        </Link>
        
        <Card className="mb-8 border-primary/20">
          <CardHeader className="text-center pb-4">
            <BrainCircuit className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle className="text-3xl font-mono">Quiz Complete</CardTitle>
            <CardDescription className="text-lg">
              You scored {result.correctCount} out of {result.totalQuestions}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-40 w-40 flex items-center justify-center rounded-full border-8 border-muted">
                <div className="absolute inset-0 rounded-full border-8 border-primary rounded-full border-t-transparent -rotate-45" style={{ transform: `rotate(${(result.score / 100) * 360 - 45}deg)` }} />
                <span className="text-4xl font-bold font-mono">{Math.round(result.score)}%</span>
              </div>
              <Badge variant={result.passed ? "default" : "destructive"} className="text-lg px-4 py-1">
                {result.passed ? "Passed" : "Needs Review"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <h3 className="text-xl font-bold mb-4 font-mono">Review Answers</h3>
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const qResult = result.results?.find((r: any) => r.questionId === q.id);
            const isCorrect = qResult?.correct;
            const userAnswer = answers[q.id];

            return (
              <Card key={q.id} className={isCorrect ? "border-green-500/30" : "border-destructive/30"}>
                <CardHeader className="pb-2">
                  <div className="flex gap-2 items-start">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-1" />
                    )}
                    <CardTitle className="text-base font-medium">{idx + 1}. {q.question}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userAnswer === optIdx;
                    const isActuallyCorrect = qResult?.correctAnswer === optIdx;
                    
                    let bgClass = "bg-muted/50 text-muted-foreground";
                    if (isActuallyCorrect) bgClass = "bg-green-500/20 text-green-500 border border-green-500/50";
                    else if (isSelected && !isActuallyCorrect) bgClass = "bg-destructive/20 text-destructive border border-destructive/50";
                    
                    return (
                      <div key={optIdx} className={`p-3 rounded-md text-sm ${bgClass}`}>
                        {opt}
                      </div>
                    );
                  })}
                  
                  {qResult?.explanation && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg text-sm border border-border/50">
                      <strong className="font-mono text-xs text-muted-foreground mb-1 block">EXPLANATION</strong>
                      {qResult.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const isAnswered = answers[currentQuestion.id] !== undefined;

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <Link href="/quizzes">
          <Button variant="ghost" className="font-mono text-muted-foreground hover:text-foreground -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quit
          </Button>
        </Link>
        <span className="font-mono text-sm text-muted-foreground">
          {currentQuestionIndex + 1} / {questions.length}
        </span>
      </div>

      <Progress value={progress} className="h-2 mb-8" />

      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectAnswer(idx)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                answers[currentQuestion.id] === idx
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              {opt}
            </button>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between pt-6 border-t border-border/50">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentQuestionIndex === 0}
            className="font-mono"
          >
            Previous
          </Button>
          
          <Button 
            onClick={handleNext} 
            disabled={!isAnswered}
            className="font-mono"
          >
            {currentQuestionIndex === questions.length - 1 ? (
              submitAttempt.isPending ? "Submitting..." : "Submit Quiz"
            ) : (
              "Next"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}