import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Terminal, LayoutDashboard, BookOpen, Layers, Library, BrainCircuit, Code2, Menu } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Topics", href: "/topics", icon: Layers },
  { name: "Resources", href: "/resources", icon: Library },
  { name: "Articles", href: "/articles", icon: BookOpen },
  { name: "Quizzes", href: "/quizzes", icon: BrainCircuit },
];

function NavLinks({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
      {navigation.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.name} href={item.href} onClick={onNavigate}>
            <div
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
              {item.name}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const ThemeToggle = () => (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-full flex items-center justify-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-muted-foreground bg-background hover:bg-accent"
    >
      {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
    </button>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Terminal className="h-6 w-6 mr-2 text-primary" />
          <span className="font-bold text-lg font-mono">DevLearn_</span>
        </div>
        <NavLinks location={location} />
        <div className="p-4 border-t border-border">
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center">
            <Terminal className="h-5 w-5 mr-2 text-primary" />
            <span className="font-bold text-base font-mono">DevLearn_</span>
          </div>
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0 flex flex-col">
                <NavLinks location={location} onNavigate={() => setMobileOpen(false)} />
                <div className="p-4 border-t border-border">
                  <ThemeToggle />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
