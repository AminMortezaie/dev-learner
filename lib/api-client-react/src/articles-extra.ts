import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

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
