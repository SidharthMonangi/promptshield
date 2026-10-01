import { useEffect, useState } from "react";
import { listScans, deleteScan } from "../lib/supabase.js";

const gradeColour = {
  A: "text-held",
  B: "text-held",
  C: "text-[#8a6a00]",
  D: "text-breach",
  F: "text-breach",
};

export default function History({ refreshKey }) {
  const [scans, setScans] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listScans()
      .then(setScans)
      .catch((err) => setError(err.message));
  }, [refreshKey]);

  async function remove(id) {
    await deleteScan(id);
    setScans((s) => s.filter((x) => x.id !== id));
  }

  return (
    <section aria-labelledby="history-heading" className="mt-16">
      <h2 id="history-heading" className="display mb-4 text-2xl">
        Your past scans
      </h2>
      {error && <p className="text-breach">Couldn't load your scans: {error}</p>}
      {scans && !scans.length && (
        <p className="text-ink-soft">Scans you run while signed in show up here so you can track fixes over time.</p>
      )}
      {scans?.length > 0 && (
        <ul className="divide-y divide-rule rounded-lg border border-rule bg-sheet">
          {scans.map((s) => (
            <li key={s.id} className="flex items-center gap-4 px-4 py-3">
              <span className={`display w-8 text-3xl ${gradeColour[s.grade]}`}>{s.grade}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {s.label}
                  {s.is_hardened && <span className="ml-2 text-sm font-normal text-held">hardened</span>}
                </p>
                <p className="text-sm text-ink-soft">
                  {s.score}/100, {s.breached_attacks.length} breached,{" "}
                  {new Date(s.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(s.id)}
                className="text-sm text-ink-soft underline underline-offset-4 hover:text-breach"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
