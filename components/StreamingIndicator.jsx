import React, { useEffect, useMemo, useState } from "react";

const DEFAULT_WORDS = [
  "Thinking",
  "Pondering",
  "Cooking",
  "Processing",
  "Crafting",
  "Brewing",
];

export function StreamingIndicator({
  words = DEFAULT_WORDS,
  intervalMs = 2000,
  className = "",
}) {
  const safeWords = useMemo(
    () => (Array.isArray(words) && words.length ? words : DEFAULT_WORDS),
    [words]
  );

  const [wordIndex, setWordIndex] = useState(0);
  const [enter, setEnter] = useState(true);

  useEffect(() => {
    let alive = true;
    let t1 = null;
    let t2 = null;

    const swapDelay = 220; // keep in sync with transition duration below

    const tick = () => {
      setEnter(false);

      t1 = setTimeout(() => {
        if (!alive) return;
        setWordIndex((prev) => (prev + 1) % safeWords.length);
        setEnter(true);
      }, swapDelay);

      t2 = setTimeout(() => {
        if (!alive) return;
        tick();
      }, intervalMs);
    };

    const start = setTimeout(tick, intervalMs);

    return () => {
      alive = false;
      clearTimeout(start);
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, [intervalMs, safeWords.length]);

  return (
    <div
      className={`flex items-center gap-2 py-1 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`${safeWords[wordIndex]}…`}
    >
      {/* Dots */}
      <div className="flex gap-1" aria-hidden="true">
        <span
          className={[
            "h-1.5 w-1.5 rounded-full",
            "bg-[var(--text-tertiary)]",
            "animate-bounce motion-reduce:animate-none",
            "[animation-duration:900ms]",
            "[animation-delay:0ms]",
            "opacity-90",
          ].join(" ")}
        />
        <span
          className={[
            "h-1.5 w-1.5 rounded-full",
            "bg-[var(--text-tertiary)]",
            "animate-bounce motion-reduce:animate-none",
            "[animation-duration:900ms]",
            "[animation-delay:140ms]",
            "opacity-90",
          ].join(" ")}
        />
        <span
          className={[
            "h-1.5 w-1.5 rounded-full",
            "bg-[var(--text-tertiary)]",
            "animate-bounce motion-reduce:animate-none",
            "[animation-duration:900ms]",
            "[animation-delay:280ms]",
            "opacity-90",
          ].join(" ")}
        />
      </div>

      {/* Word */}
      <span
        className={[
          "text-sm text-[var(--text-tertiary)]",
          "transition-all duration-200 motion-reduce:transition-none",
          enter ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-0.5",
        ].join(" ")}
      >
        {safeWords[wordIndex]}…
      </span>
    </div>
  );
}
