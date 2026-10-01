import { useState } from "react";
import { CATEGORIES } from "../../shared/attacks.js";
import Highlight from "./Highlight.jsx";

const categoryName = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));

const STATUS = {
  breached: { label: "Breached", className: "bg-breach text-sheet" },
  defended: { label: "Held", className: "bg-held text-sheet" },
  error: { label: "Didn't run", className: "bg-rule text-ink" },
};

function AttackRow({ result, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const status = STATUS[result.status];
  const panelId = `attack-${result.id}`;

  return (
    <li className="border-b border-rule last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="grid w-full grid-cols-[6.5rem_1fr_auto] items-center gap-3 px-1 py-3 text-left hover:bg-paper sm:gap-5"
      >
        <span className={`condensed rounded px-2 py-1 text-center text-sm font-bold ${status.className}`}>{status.label}</span>
        <span>
          <span className="block font-semibold">{result.name}</span>
          <span className="block text-sm text-ink-soft">{categoryName[result.category]}</span>
        </span>
        <svg
          className={`h-4 w-4 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M3 6l5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div id={panelId} className="grid gap-4 px-1 pb-5 md:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink-soft">The attacker sent</p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-ink p-3 font-mono text-[13px] leading-relaxed text-sheet">
              {result.attackText || "Not sent."}
            </pre>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink-soft">Your bot replied</p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-rule bg-sheet p-3 font-mono text-[13px] leading-relaxed">
              {result.response ? <Highlight text={result.response} terms={result.evidence} /> : "No reply."}
            </pre>
          </div>
          <p className="text-sm md:col-span-2">
            <span className="font-semibold">Why: </span>
            {result.reason}
          </p>
        </div>
      )}
    </li>
  );
}

function Group({ title, results, defaultOpen = false, rowsOpen = false, tone }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!results.length) return null;
  const id = `group-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="rounded-lg border border-rule bg-sheet">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
      >
        <span className="flex items-baseline gap-3">
          <span className={`display text-2xl tabular-nums ${tone}`}>{results.length}</span>
          <span className="font-semibold">{title}</span>
        </span>
        <span className="text-sm font-semibold underline underline-offset-4">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <ul id={id} className="border-t border-rule px-3">
          {results.map((r) => (
            <AttackRow key={r.id} result={r} defaultOpen={rowsOpen} />
          ))}
        </ul>
      )}
    </div>
  );
}

// Breaches lead, fully expanded, because they're what you need to fix.
// Attacks the bot withstood are folded into one line.
export default function AttackLog({ results }) {
  const breached = results.filter((r) => r.status === "breached");
  const held = results.filter((r) => r.status === "defended");
  const errored = results.filter((r) => r.status === "error");

  return (
    <section aria-labelledby="log-heading" className="grid gap-4">
      <h3 id="log-heading" className="display text-2xl">
        {breached.length ? "What got through" : "Every attack was stopped"}
      </h3>
      {breached.length > 0 && (
        <ul className="rounded-lg border-2 border-breach bg-sheet px-3">
          {breached.map((r, i) => (
            <AttackRow key={r.id} result={r} defaultOpen={i < 2} />
          ))}
        </ul>
      )}
      <Group title={held.length === 1 ? "attack your bot held off" : "attacks your bot held off"} results={held} tone="text-held" />
      <Group title={errored.length === 1 ? "attack couldn't run (try again)" : "attacks couldn't run (try again)"} results={errored} tone="text-ink-soft" />
    </section>
  );
}
