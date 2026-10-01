import { useEffect, useState } from "react";

export function usePrefersReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduce, setReduce] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setReduce(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduce;
}

// Reveals `text` progressively once `start` is true. Long text never takes
// longer than `maxMs`, so a big reply doesn't hold up the feed.
export function useTypewriter(text = "", { start = true, perChar = 14, maxMs = 900 } = {}) {
  const reduce = usePrefersReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) {
      setCount(0);
      return;
    }
    if (reduce || !text) {
      setCount(text.length);
      return;
    }
    const duration = Math.min(text.length * perChar, maxMs);
    setCount(0);
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setCount(Math.round(p * text.length));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, start, reduce, perChar, maxMs]);

  return { shown: text.slice(0, count), done: start && count >= text.length };
}
