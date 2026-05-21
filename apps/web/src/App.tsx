import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/layout";
import { registerServiceWorkerUpdates } from "@/shared/pwa/register-sw";
import NotFound from "@/pages/not-found";
import { setBaseUrl } from "@devlearn/api-client";

import Dashboard from "@/pages/dashboard";
import Topics from "@/pages/topics";
import Resources from "@/pages/resources";
import Articles from "@/pages/articles";
import ArticleView from "@/pages/article-view";
import Quizzes from "@/pages/quizzes";
import QuizView from "@/pages/quiz-view";
import LanguageHub from "@/pages/language-hub";
import SyntaxLessons from "@/pages/syntax-lessons";

if (import.meta.env.PROD && import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL as string);
}

registerServiceWorkerUpdates();

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/topics" component={Topics} />
        <Route path="/resources" component={Resources} />
        <Route path="/articles" component={Articles} />
        <Route path="/articles/:id" component={ArticleView} />
        <Route path="/quizzes" component={Quizzes} />
        <Route path="/quizzes/:id" component={QuizView} />
        <Route path="/language/:slug" component={LanguageHub} />
        <Route path="/syntax/:languageSlug" component={SyntaxLessons} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="devlearn-theme">
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
