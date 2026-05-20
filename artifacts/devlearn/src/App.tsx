import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import { setBaseUrl } from "@workspace/api-client-react";

// In production (GitHub Pages), point API calls at the deployed Render backend.
// In dev, Vite's proxy handles /api/* so no base URL is needed.
if (import.meta.env.PROD && import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL as string);
}

// Auto-update: works for both browser tabs and installed PWA.
// On every app open, actively check for a new service worker version.
// When a new SW activates (controllerchange), reload so the fresh build is shown.
if ("serviceWorker" in navigator) {
  let reloading = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  // Force an update check each time the app gains focus (covers PWA reopens).
  window.addEventListener("focus", () => {
    navigator.serviceWorker.getRegistration().then((reg) => reg?.update());
  });

  // Also check immediately on page load.
  navigator.serviceWorker.ready.then((reg) => reg.update());
}

// Pages placeholder
import Dashboard from "@/pages/dashboard";
import Topics from "@/pages/topics";
import Resources from "@/pages/resources";
import Articles from "@/pages/articles";
import ArticleView from "@/pages/article-view";
import Quizzes from "@/pages/quizzes";
import QuizView from "@/pages/quiz-view";
import LanguageHub from "@/pages/language-hub";
import SyntaxLessons from "@/pages/syntax-lessons";

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