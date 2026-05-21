import { HttpError } from "./errors.ts";

export function parseIntParam(value: unknown, name: string): number {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) {
    throw new HttpError(400, `Invalid '${name}' parameter`);
  }
  return n;
}

export function parseOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

export function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t === "" ? undefined : t;
}
