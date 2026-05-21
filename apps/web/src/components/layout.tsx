import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, BookOpen, Layers, Library, BrainCircuit, Menu } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PageBack } from "@/shared/components/page-back";

function LogoMark({ size = 28 }: { size?: number }) {
  const s = size / 28;
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lbg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5C1A"/>
          <stop offset="100%" stopColor="#CC2800"/>
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="6" fill="url(#lbg)"/>
      <rect x="0.5" y="0.5" width="27" height="13" rx="5.5" fill="white" fillOpacity="0.08"/>
      <path d="M5 8.5 L12.5 14 L5 19.5" stroke="white" strokeWidth={2.2 * s} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="14.5" y1="19" x2="22.5" y2="19" stroke="white" strokeWidth={2.2 * s} strokeLinecap="round"/>
    </svg>
  );
}

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
        <div className="h-14 flex items-center px-4 border-b border-border gap-2.5">
          <LogoMark size={30} />
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
          <div className="flex items-center gap-2">
            <LogoMark size={26} />
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
            <PageBack />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
