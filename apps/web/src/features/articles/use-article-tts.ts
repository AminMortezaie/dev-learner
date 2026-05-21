import { useEffect, useRef, useState } from "react";
import { pickVoice, stripMarkdownForSpeech } from "./tts";

type TtsState = "idle" | "playing" | "paused";

export function useArticleTts(title: string, content: string) {
  const [ttsState, setTtsState] = useState<TtsState>("idle");
  const [activeSegIdx, setActiveSegIdx] = useState(-1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const segRefs = useRef<(HTMLDivElement | null)[]>([]);

  const contentSegments = content.split(/\n\n+/).filter((s) => s.trim());

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const startTTS = (fromSegIdx: number) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const voice = pickVoice(synth.getVoices());
    const segTexts = contentSegments.map((s) => stripMarkdownForSpeech(s)).filter((s) => s.trim());
    const allParts: string[] = [title, ...segTexts];
    const startIdx = fromSegIdx + 1;

    const speakAt = (idx: number) => {
      if (idx >= allParts.length) {
        setTtsState("idle");
        setActiveSegIdx(-1);
        return;
      }

      const segIdx = idx - 1;
      setActiveSegIdx(segIdx);
      if (segIdx >= 0) {
        const el = segRefs.current[segIdx];
        if (el) {
          const { top, bottom } = el.getBoundingClientRect();
          const vh = window.innerHeight;
          if (top < 80 || bottom > vh - 80) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      } else {
        document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
      }

      const utt = new SpeechSynthesisUtterance(allParts[idx]!);
      if (voice) utt.voice = voice;
      utt.rate = 1.0;
      utt.pitch = 1.0;
      utt.onend = () => speakAt(idx + 1);
      utt.onerror = (e) => {
        const err = (e as SpeechSynthesisErrorEvent).error;
        if (err !== "canceled" && err !== "interrupted") {
          setTtsState("idle");
          setActiveSegIdx(-1);
        }
      };
      utteranceRef.current = utt;
      synth.speak(utt);
    };

    speakAt(startIdx);
    setTtsState("playing");
  };

  const handleListen = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (ttsState === "playing") {
      synth.pause();
      setTtsState("paused");
      return;
    }
    if (ttsState === "paused") {
      synth.resume();
      setTtsState("playing");
      return;
    }
    setActiveSegIdx(-1);
    startTTS(-1);
  };

  const handleSegmentClick = (segIdx: number) => {
    startTTS(segIdx);
  };

  const handleStop = () => {
    window.speechSynthesis?.cancel();
    setTtsState("idle");
    setActiveSegIdx(-1);
  };

  return {
    ttsState,
    activeSegIdx,
    contentSegments,
    segRefs,
    handleListen,
    handleSegmentClick,
    handleStop,
  };
}
