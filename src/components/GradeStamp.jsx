export default function GradeStamp({ grade, score, size = "lg", animate = false, caption }) {
  const dims = size === "lg" ? "h-44 w-44 sm:h-52 sm:w-52" : "h-32 w-32";
  const letter = size === "lg" ? "text-[5.5rem] sm:text-[6.5rem]" : "text-[3rem]";
  const scoreText = size === "lg" ? "text-base" : "text-[11px] mt-0.5";

  return (
    <figure className="flex flex-col items-center gap-3">
      <div
        className={`stamp ${dims}`}
        data-grade={grade}
        data-animate={animate}
        role="img"
        aria-label={`Grade ${grade}, ${score} out of 100`}
      >
        <div className="flex flex-col items-center">
          <span className={`stamp-letter ${letter}`}>{grade}</span>
          <span className={`condensed font-bold tabular-nums ${scoreText}`}>{score} / 100</span>
        </div>
      </div>
      {caption && <figcaption className="text-sm font-semibold text-ink-soft">{caption}</figcaption>}
    </figure>
  );
}
