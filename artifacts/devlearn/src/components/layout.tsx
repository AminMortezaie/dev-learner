import { Link, useLocation } from "wouter";
import { Terminal, LayoutDashboard, BookOpen, Layers, Library, BrainCircuit, Code2 } from "lucide-react";
import { useTheme } from "./theme-provider";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Topics", href: "/topics", icon: Layers },
    { name: "Resources", href: "/resources", icon: Library },
    { name: "Articles", href: "/articles", icon: BookOpen },
    { name: "Quizzes", href: "/quizzes", icon: BrainCircuit },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Terminal className="h-6 w-6 mr-2 text-primary" />
          <span className="font-bold text-lg font-mono">DevLearn_</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
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

        <div className="p-4 border-t border-border">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center justify-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-muted-foreground bg-background hover:bg-accent"
          >
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}