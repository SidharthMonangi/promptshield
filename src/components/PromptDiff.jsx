import { useMemo, useState } from "react";
import { diffLines } from "../lib/diff.js";

const STYLE = {
  added: { row: "bg-held-tint", sign: "+", signClass: "text-held", label: "Added" },
  removed: { row: "bg-breach-tint text-ink-soft line-through decoration-breach/50", sign: "−", signClass: "text-breach", label: "Removed" },
  same: { row: "", sign: " ", signClass: "", label: "" },
};

export default function PromptDiff({ before, after }) {
  const [view, setView] = useState("changes");
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => diffLines(before, after), [before, after]);
  const added = lines.filter((l) => l.type === "added").length;
  const removed = lines.filter((l) => l.type === "removed").length;

  async function copy() {
    await navigator.clipboard.writeText(after);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Your hardened prompt</h3>
          <p className="text-sm text-ink-soft">
            <span className="text-held">{added} lines added</span>, <span className="text-breach">{removed} removed</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div role="tablist" aria-label="Prompt view" className="inline-flex rounded-md border border-rule bg-paper p-0.5 text-sm">
            {[
              ["changes", "Changes"],
              ["full", "Full prompt"],
            ].map(([key, text]) => (
              <button
                key={key}
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={`rounded px-3 py-1 font-semibold ${view === key ? "bg-ink text-sheet" : ""}`}
              >
                {text}
              </button>
            ))}
          </div>
          <button type="button" onClick={copy} className="rounded-md bg-ink px-3 py-1.5 text-sm font-bold text-sheet">
            {copied ? "Copied" : "Copy prompt"}
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-auto rounded-lg border border-rule bg-sheet font-mono text-[13px] leading-relaxed">
        {view === "full" ? (
          <pre className="whitespace-pre-wrap break-words p-4">{after}</pre>
        ) : (
          <ol className="py-2">
            {lines.map((l, i) => (
              <li key={i} className={`grid grid-cols-[1.75rem_1fr] px-2 ${STYLE[l.type].row}`}>
                <span className={`select-none text-center font-bold ${STYLE[l.type].signClass}`} aria-label={STYLE[l.type].label}>
                  {STYLE[l.type].sign}
                </span>
                <span className="whitespace-pre-wrap break-words py-0.5">{l.text || " "}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
