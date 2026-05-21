const STORAGE_PREFIX = "devlearn-project-progress:";

export function getCompletedSteps(projectId: number): number[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

export function markStepComplete(projectId: number, stepIndex: number): number[] {
  const current = new Set(getCompletedSteps(projectId));
  current.add(stepIndex);
  const next = [...current].sort((a, b) => a - b);
  localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify(next));
  return next;
}

export function clearProjectProgress(projectId: number): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${projectId}`);
}
