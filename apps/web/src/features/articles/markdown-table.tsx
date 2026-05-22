import { useState } from "react";
import { renderInline } from "./markdown-inline";

type MarkdownTableProps = {
  header: string[];
  rows: string[][];
};

function cellAlign(colIndex: number, colCount: number): string {
  if (colCount === 2 && colIndex === 1) return "text-center tabular-nums";
  if (colIndex === 0) return "text-left";
  return "text-center tabular-nums";
}

export function MarkdownTable({ header, rows }: MarkdownTableProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const colCount = header.length;

  return (
    <div
      className="not-prose my-6 w-full"
      role="region"
      aria-label="Data table"
    >
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card/40 shadow-sm ring-1 ring-white/5 transition-shadow duration-300 hover:shadow-md dark:bg-card/60 dark:shadow-black/20">
        <div className="max-h-[min(70vh,520px)] overflow-auto">
          <table className="w-full min-w-[280px] border-collapse text-[0.9375rem] leading-relaxed">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-muted/95 backdrop-blur-sm dark:bg-muted/80">
                {header.map((cell, j) => (
                  <th
                    key={j}
                    scope="col"
                    className="px-5 py-4 text-center text-sm font-semibold text-foreground shadow-[0_1px_0_0_hsl(var(--border))]"
                  >
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const isHovered = hoveredRow === ri;
                return (
                  <tr
                    key={ri}
                    onMouseEnter={() => setHoveredRow(ri)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`border-b border-border/30 last:border-b-0 transition-[background-color,box-shadow] duration-200 ease-out ${
                      isHovered
                        ? "bg-primary/[0.08] shadow-[inset_3px_0_0_0_hsl(var(--primary))] dark:bg-primary/12"
                        : ri % 2 === 1
                          ? "bg-muted/20 dark:bg-muted/10"
                          : "bg-transparent"
                    }`}
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`px-5 py-3.5 align-middle text-foreground/90 transition-colors duration-200 ${
                          cellAlign(ci, colCount)
                        } ${isHovered ? "text-foreground" : ""} ${
                          ci === 0 ? "font-medium" : ""
                        }`}
                      >
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
