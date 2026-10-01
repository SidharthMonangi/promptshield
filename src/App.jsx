import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ATTACKS, getAttack } from "../shared/attacks.js";
import { computeScore } from "../shared/scoring.js";
import { scanPrompt, hardenPrompt } from "./lib/api.js";
import { supabase, authEnabled, saveScan } from "./lib/supabase.js";
import { EXAMPLE_PROMPT, EXAMPLE_LABEL } from "./lib/example.js";
import { buildReport } from "./lib/report.js";
import GradeStamp from "./components/GradeStamp.jsx";
import CategoryBreakdown from "./components/CategoryBreakdown.jsx";
import AttackLog from "./components/AttackLog.jsx";
import AuthControls from "./components/AuthControls.jsx";
import History from "./components/History.jsx";
import LiveFeed from "./components/LiveFeed.jsx";
import PromptDiff from "./components/PromptDiff.jsx";
import HeroDemo from "./components/HeroDemo.jsx";

const TOTAL = ATTACKS.length;

function verdictLine(summary) {
  if (summary.breached === 0) return "Every attack bounced off. This prompt is in good shape.";
  if (summary.score >= 75) return `Mostly solid, but ${summary.breached} attack${summary.breached > 1 ? "s" : ""} still got through.`;
  if (summary.score >= 40) return `${summary.breached} of ${summary.total} attacks got through. Someone will find these.`;
  return `${summary.breached} of ${summary.total} attacks got through. This bot does what strangers tell it to.`;
}

// Tracks a scan as it streams in: which attacks are in flight and which have landed.
function useLiveScan() {
  const [feed, setFeed] = useState({});
  const [order, setOrder] = useState([]);
  const reset = useCallback(() => {
    setFeed({});
    setOrder([]);
  }, []);
  const onStart = useCallback((id) => {
    const a = getAttack(id);
    setFeed((f) => ({ ...f, [id]: { id, name: a.name, category: a.category, status: "running" } }));
    setOrder((o) => [...o, id]);
  }, []);
  const onResult = useCallback((r) => setFeed((f) => ({ ...f, [r.id]: r })), []);
  return { feed, order, reset, onStart, onResult };
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [label, setLabel] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | scanning | scanned | hardening | rescanning | compared
  const [results, setResults] = useState([]);
  const [hardened, setHardened] = useState("");
  const [afterResults, setAfterResults] = useState([]);
  const [view, setView] = useState("after");
  const [error, setError] = useState("");
  const [reportCopied, setReportCopied] = useState(false);
  const [session, setSession] = useState(null);
  const [historyKey, setHistoryKey] = useState(0);
  const resultsRef = useRef(null);
  const hardenRef = useRef(null);
  const live = useLiveScan();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const summary = useMemo(() => computeScore(results), [results]);
  const afterSummary = useMemo(() => computeScore(afterResults), [afterResults]);
  const busy = phase === "scanning" || phase === "hardening" || phase === "rescanning";
  const tooShort = prompt.trim().length < 20;

  async function persist(res, sum, isHardened) {
    if (!session) return;
    try {
      await saveScan({ label: label.trim() || prompt.trim().slice(0, 60), summary: sum, results: res, hardened: isHardened });
      setHistoryKey((k) => k + 1);
    } catch {
      // Saving history is a bonus; a failure here shouldn't interrupt the scan.
    }
  }

  async function runScan() {
    setError("");
    setResults([]);
    setAfterResults([]);
    setHardened("");
    live.reset();
    setPhase("scanning");
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    try {
      const { results: res } = await scanPrompt(prompt, { onStart: live.onStart, onResult: live.onResult });
      const sum = computeScore(res);
      if (sum.total === 0) {
        setPhase("idle");
        setError(`None of the attacks could run. ${res[0]?.reason || "The AI model didn't respond."} Try again in a minute.`);
        return;
      }
      setResults(res);
      setPhase("scanned");
      persist(res, sum, false);
    } catch (err) {
      setError(err.message);
      setPhase("idle");
    }
  }

  async function runHarden() {
    setError("");
    setPhase("hardening");
    requestAnimationFrame(() => hardenRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    try {
      const fixed = await hardenPrompt(prompt, results);
      setHardened(fixed);
      live.reset();
      setPhase("rescanning");
      const { results: res } = await scanPrompt(fixed, { onStart: live.onStart, onResult: live.onResult });
      setAfterResults(res);
      setView("after");
      setPhase("compared");
      persist(res, computeScore(res), true);
    } catch (err) {
      setError(err.message);
      setPhase("scanned");
    }
  }

  function loadExample() {
    setPrompt(EXAMPLE_PROMPT);
    setLabel(EXAMPLE_LABEL);
  }

  async function copyReport() {
    const text = buildReport({
      label: label.trim(),
      summary,
      results,
      after: phase === "compared" ? { summary: afterSummary } : null,
    });
    await navigator.clipboard.writeText(text);
    setReportCopied(true);
    setTimeout(() => setReportCopied(false), 2000);
  }

  const showingResults = phase !== "idle" || results.length > 0;
  const logResults = phase === "compared" && view === "after" ? afterResults : results;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <header className="flex items-center justify-between py-6">
        <a href="/" className="flex items-center gap-2.5" aria-label="PromptShield home">
          <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-full border-[3px] border-ink">
            <span className="display text-base">A</span>
          </span>
          <span className="display text-xl">PromptShield</span>
        </a>
        {authEnabled && <AuthControls session={session} />}
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="grid items-center gap-10 pt-6 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <h1 className="display text-[2.5rem] sm:text-[3.6rem]">Find out how your chatbot breaks before someone else does.</h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Paste your bot's system prompt. PromptShield fires {TOTAL} real prompt-injection attacks at it, shows you every
            one that got through, and rewrites the prompt to stop them.
          </p>
        </div>
        <HeroDemo />
      </section>

      <section className="mt-12 rounded-xl border border-rule bg-sheet p-4 sm:p-6">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor="prompt" className="font-bold">
            Your chatbot's system prompt
          </label>
          <button
            type="button"
            onClick={loadExample}
            disabled={busy}
            className="text-sm font-semibold underline underline-offset-4 disabled:opacity-50"
          >
            Try the example bot
          </button>
        </div>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={busy}
          rows={7}
          maxLength={8000}
          placeholder="You are a helpful assistant for Acme Bank. Only answer questions about our savings accounts…"
          className="w-full resize-y rounded-lg border border-rule bg-paper p-3 font-mono text-[14px] leading-relaxed disabled:opacity-60"
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 sm:max-w-xs">
            <label htmlFor="label" className="sr-only">
              Name this bot (optional)
            </label>
            <input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={busy}
              placeholder="Name this bot (optional)"
              className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="text-sm tabular-nums text-ink-soft">{prompt.length.toLocaleString()} / 8,000</span>
            <button
              type="button"
              onClick={runScan}
              disabled={busy || tooShort}
              className="rounded-lg bg-ink px-6 py-3 font-bold text-sheet hover:bg-[#22355a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {phase === "scanning" ? "Attacking…" : `Run ${TOTAL} attacks`}
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-md bg-breach-tint p-3 text-sm font-semibold text-breach">
            {error}
          </p>
        )}
      </section>

      {/* ── Results ──────────────────────────────────────────────────── */}
      {showingResults && (
        <section ref={resultsRef} className="mt-16 scroll-mt-6">
          {phase === "scanning" && <LiveFeed label="Attacking your bot" feed={live.feed} order={live.order} />}

          {phase !== "scanning" && results.length > 0 && (
            <>
              <div className="grid items-center gap-8 md:grid-cols-[auto_1fr] md:gap-12">
                <GradeStamp grade={summary.grade} score={summary.score} animate />
                <div>
                  <h2 className="display text-3xl sm:text-4xl">{verdictLine(summary)}</h2>
                  <p className="mt-3 text-ink-soft">
                    {summary.defended} held, {summary.breached} breached
                    {summary.errored > 0 && `, ${summary.errored} couldn't run (rate limit, try again)`}.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    {summary.breached > 0 && phase === "scanned" && (
                      <button type="button" onClick={runHarden} className="rounded-lg bg-held px-6 py-3 font-bold text-sheet hover:brightness-110">
                        Harden this prompt
                      </button>
                    )}
                    <button type="button" onClick={copyReport} className="text-sm font-semibold underline underline-offset-4">
                      {reportCopied ? "Report copied" : "Copy report"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <CategoryBreakdown summary={summary} results={results} />
              </div>
            </>
          )}

          {/* ── Hardening ────────────────────────────────────────────── */}
          {(phase === "hardening" || phase === "rescanning" || phase === "compared") && (
            <div ref={hardenRef} className="mt-16 scroll-mt-6 rounded-xl border-2 border-held bg-sheet p-5 sm:p-8">
              {phase === "hardening" && <HardeningProgress />}
              {phase === "rescanning" && <LiveFeed label="Re-running every attack on the hardened prompt" feed={live.feed} order={live.order} />}
              {phase === "compared" && (
                <>
                  <h2 className="display text-3xl">Before and after hardening</h2>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12">
                    <GradeStamp grade={summary.grade} score={summary.score} size="sm" caption="Your prompt" />
                    <svg className="h-8 w-12 text-ink-soft" viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M2 12h40M34 4l8 8-8 8" />
                    </svg>
                    <GradeStamp grade={afterSummary.grade} score={afterSummary.score} size="sm" animate caption="Hardened prompt" />
                  </div>
                  <p className="mt-6 text-center text-lg font-semibold">
                    {afterSummary.score > summary.score
                      ? `Score up ${afterSummary.score - summary.score} points. ${afterSummary.breached === 0 ? "Nothing got through." : `${afterSummary.breached} attack${afterSummary.breached > 1 ? "s" : ""} still got through.`}`
                      : "No improvement this time. Run hardening again or edit the prompt by hand."}
                  </p>
                </>
              )}

              {hardened && phase !== "hardening" && (
                <div className="mt-10">
                  <PromptDiff before={prompt} after={hardened} />
                </div>
              )}
            </div>
          )}

          {/* ── Attack log ───────────────────────────────────────────── */}
          {phase !== "scanning" && phase !== "rescanning" && results.length > 0 && (
            <div className="mt-16">
              {phase === "compared" && (
                <div role="tablist" aria-label="Which scan to show" className="mb-5 inline-flex rounded-lg border border-rule bg-sheet p-1">
                  {[
                    ["before", "Your prompt"],
                    ["after", "Hardened prompt"],
                  ].map(([key, text]) => (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={view === key}
                      onClick={() => setView(key)}
                      className={`rounded-md px-4 py-1.5 text-sm font-semibold ${view === key ? "bg-ink text-sheet" : ""}`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}
              <AttackLog key={view} results={logResults} />
            </div>
          )}
        </section>
      )}

      {session && <History refreshKey={historyKey} />}

      <footer className="mt-24 border-t border-rule pt-6 text-sm text-ink-soft">
        <p className="max-w-3xl">
          Built for LovHack Season 3. Detection uses planted canary tokens and attacker proof tokens, so most verdicts are
          exact matches rather than an AI's opinion. Only test bots you own or have permission to test.
        </p>
      </footer>
    </div>
  );
}

function HardeningProgress() {
  return (
    <div>
      <p className="display text-2xl">Rewriting your prompt with defences</p>
      <p className="mt-2 text-ink-soft">Adding rules for every attack that got through, while keeping your bot's purpose and tone.</p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-rule" role="progressbar" aria-label="Hardening in progress">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-held" />
      </div>
    </div>
  );
}
