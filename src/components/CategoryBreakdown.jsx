import { ATTACKS } from "../../shared/attacks.js";

// One row per attack category. Each square is one attack:
// teal = the bot held, red = it was breached, grey = still running or errored.
export default function CategoryBreakdown({ summary, results }) {
  const statusById = Object.fromEntries(results.map((r) => [r.id, r.status]));

  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {summary.byCategory.map((cat) => {
        const attacks = ATTACKS.filter((a) => a.category === cat.id);
        return (
          <li key={cat.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
            <div>
              <p className="condensed text-lg font-bold">{cat.name}</p>
              <p className="text-sm text-ink-soft">{cat.blurb}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5" aria-hidden="true">
                {attacks.map((a) => {
                  const s = statusById[a.id];
                  const colour =
                    s === "defended" ? "bg-held" : s === "breached" ? "bg-breach" : "bg-rule";
                  return <span key={a.id} title={a.name} className={`h-5 w-5 rounded-sm ${colour}`} />;
                })}
              </div>
              <p className="condensed w-28 text-right text-sm font-semibold tabular-nums">
                {cat.total ? `${cat.defended} of ${cat.total} held` : "Not run"}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
