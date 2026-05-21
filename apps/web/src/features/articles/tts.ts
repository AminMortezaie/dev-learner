export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " code block. ")
    .replace(/`[^`]+`/g, (m) => m.slice(1, -1))
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/>\s?/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const eng = voices.filter((v) => v.lang.startsWith("en"));
  const pool = eng.length ? eng : voices;
  return (
    pool.find((v) => v.name === "Daniel") ??
    pool.find((v) => v.name.toLowerCase().includes("daniel")) ??
    pool.find((v) => v.name === "Samantha") ??
    pool.find((v) => v.name.toLowerCase().includes("google")) ??
    pool[0] ??
    null
  );
}
