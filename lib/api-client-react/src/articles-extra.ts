import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { Article } from "./generated/api.schemas";

export interface ImportFromUrlInput {
  url: string;
  languageId?: number;
}

export const importArticleFromUrl = (input: ImportFromUrlInput): Promise<Article> =>
  customFetch<Article>("/api/articles/from-url", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const useImportArticleFromUrl = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<Article, TError, ImportFromUrlInput, TContext>,
) =>
  useMutation<Article, TError, ImportFromUrlInput, TContext>({
    mutationKey: ["importArticleFromUrl"],
    mutationFn: importArticleFromUrl,
    ...options,
  });

export const polishArticleContent = (content: string): Promise<{ content: string }> =>
  customFetch<{ content: string }>("/api/articles/polish", {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const usePolishContent = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<{ content: string }, TError, string, TContext>,
) =>
  useMutation<{ content: string }, TError, string, TContext>({
    mutationKey: ["polishContent"],
    mutationFn: polishArticleContent,
    ...options,
  });
