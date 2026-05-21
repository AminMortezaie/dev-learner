import { Link, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type BackTarget = { href: string; label: string };

function resolveBackTarget(path: string): BackTarget | null {
  const normalized = path.replace(/\/$/, "") || "/";
  if (normalized === "/") return null;

  const articleMatch = normalized.match(/^\/articles\/(\d+)$/);
  if (articleMatch) return { href: "/articles", label: "Back to Library" };

  const quizMatch = normalized.match(/^\/quizzes\/(\d+)$/);
  if (quizMatch) return { href: "/quizzes", label: "Back to Quizzes" };

  const syntaxMatch = normalized.match(/^\/syntax\/([^/]+)$/);
  if (syntaxMatch) {
    return { href: `/language/${syntaxMatch[1]}`, label: "Back to Language" };
  }

  const languageMatch = normalized.match(/^\/language\/([^/]+)$/);
  if (languageMatch) return { href: "/", label: "Back to Dashboard" };

  if (["/topics", "/resources", "/articles", "/quizzes"].includes(normalized)) {
    return { href: "/", label: "Back to Dashboard" };
  }

  return { href: "/", label: "Back to Dashboard" };
}

export function PageBack() {
  const [location] = useLocation();
  const target = resolveBackTarget(location);
  if (!target) return null;

  return (
    <Link href={target.href}>
      <Button
        variant="ghost"
        className="mb-6 -ml-4 font-mono text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {target.label}
      </Button>
    </Link>
  );
}
