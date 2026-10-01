import { ATTACKS, CATEGORIES } from "../../shared/attacks.js";
import { useTypewriter } from "../lib/motion.js";
import Highlight from "./Highlight.jsx";

const categoryName = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));

function Verdict({ status }) {
  if (status === "breached") return <span className="verdict-in condensed rounded bg-breach px-2 py-0.5 text-sm font-bold text-sheet">Breached</span>;
  if (status === "defended") return <span className="verdict-in condensed rounded bg-held px-2 py-0.5 text-sm font-bold text-sheet">Held</span>;
  return <span className="condensed rounded bg-ink-soft px-2 py-0.5 text-sm font-bold text-sheet">Didn't run</span>;
}

function FeedItem({ item }) {
  const finished = item.status !== "running";
  const attack = useTypewriter(item.attackText, { start: finished, maxMs: 700 });
  const reply = useTypewriter(item.response || "No reply.", { start: attack.done, maxMs: 800 });

  return (
    <li className="border-b border-white/10 py-4 last:border-b-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sheet">
          <span className="font-semibold">{item.name}</span>
          <span className="ml-2 text-sm text-sheet/60">{categoryName[item.category]}</span>
        </p>
        {finished && reply.done ? (
          <Verdict status={item.status} />
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-sheet/60" aria-label="Attack in progress">
            <span className="sending-dot" />
            <span className="sending-dot [animation-delay:150ms]" />
            <span className="sending-dot [animation-delay:300ms]" />
          </span>
        )}
      </div>
      {finished && item.status !== "error" && (
        <div className="grid gap-2 font-mono text-[12.5px] leading-relaxed">
          <p className="whitespace-pre-wrap break-words text-sheet/75">
            <span className="select-none text-sheet/45">attacker  </span>
            {attack.shown}
          </p>
          {attack.done && (
            <p className="whitespace-pre-wrap break-words text-sheet">
              <span className="select-none text-sheet/45">your bot  </span>
              <Highlight text={reply.shown} terms={item.evidence} />
            </p>
          )}
        </div>
      )}
      {item.status === "error" && <p className="text-sm text-sheet/70">{item.reason}</p>}
    </li>
  );
}

// The scan in progress: a 25-square tally that fills in as verdicts land, and a
// feed of each attack being fired at the bot with its reply.
export default function LiveFeed({ label, feed, order }) {
  const items = order.map((id) => feed[id]).reverse();
  const done = Object.values(feed).filter((f) => f.status !== "running");
  const held = done.filter((f) => f.status === "defended").length;
  const breached = done.filter((f) => f.status === "breached").length;

  return (
    <section aria-label={label}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="display text-3xl">{label}</h2>
        <p className="condensed text-lg font-semibold tabular-nums" aria-live="polite">
          <span className="text-held">{held} held</span>
          <span className="mx-3 text-rule">/</span>
          <span className="text-breach">{breached} breached</span>
          <span className="mx-3 text-rule">/</span>
          <span className="text-ink-soft">{ATTACKS.length - done.length} to go</span>
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2" aria-hidden="true">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="flex gap-1">
            {ATTACKS.filter((a) => a.category === cat.id).map((a) => {
              const s = feed[a.id]?.status;
              const cls =
                s === "defended" ? "bg-held" : s === "breached" ? "bg-breach" : s === "running" ? "tally-running" : s === "error" ? "bg-ink-soft" : "bg-rule";
              return <span key={a.id} title={a.name} className={`h-4 w-4 rounded-sm ${cls}`} />;
            })}
          </div>
        ))}
      </div>

      <ol className="mt-6 max-h-[34rem] overflow-y-auto rounded-xl bg-ink px-5 py-1 sm:px-6">
        {items.length === 0 && <li className="py-6 text-sheet/70">Lining up the first attacks…</li>}
        {items.map((item) => (
          <FeedItem key={item.id} item={item} />
        ))}
      </ol>
    </section>
  );
}
