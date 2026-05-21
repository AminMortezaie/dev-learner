import type { LucideIcon } from "lucide-react";
import { Code2, Coffee, Cpu, Network, Terminal, Workflow } from "lucide-react";

export const languageIcons: Record<string, LucideIcon> = {
  "system-design": Network,
  java: Coffee,
  kotlin: Workflow,
  golang: Cpu,
  python: Terminal,
};

export const languageColors: Record<string, string> = {
  "system-design": "text-slate-400",
  java: "text-orange-500",
  kotlin: "text-purple-500",
  golang: "text-teal-400",
  python: "text-blue-400",
};

export function getLanguageIcon(slug: string): LucideIcon {
  return languageIcons[slug] ?? Code2;
}

export function getLanguageColor(slug: string): string {
  return languageColors[slug] ?? "text-primary";
}
