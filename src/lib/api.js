import { ATTACK_IDS, getAttack } from "../../shared/attacks.js";

// Attacks run one per request, a few at a time, so results stream into the UI
// as they finish instead of arriving in lumps.
const CONCURRENCY = 4;

async function post(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed with status ${res.status}.`);
    // Bad input or a missing API key will fail every attack the same way, so stop early.
    err.fatal = (res.status >= 400 && res.status < 500 && res.status !== 429) || res.status === 503;
    throw err;
  }
  return data;
}

export async function scanPrompt(systemPrompt, { onStart, onResult } = {}) {
  const results = new Array(ATTACK_IDS.length);
  let next = 0;
  let fatal = null;

  async function worker() {
    while (next < ATTACK_IDS.length && !fatal) {
      const i = next++;
      const id = ATTACK_IDS[i];
      onStart?.(id);
      try {
        const data = await post("/api/scan", { systemPrompt, attackIds: [id] });
        results[i] = data.results[0];
      } catch (err) {
        if (err.fatal) {
          fatal = err;
          return;
        }
        const a = getAttack(id);
        results[i] = { id, name: a.name, category: a.category, attackText: "", status: "error", reason: err.message, response: "", evidence: [] };
      }
      onResult?.(results[i]);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (fatal) throw fatal;
  return { results };
}

export async function hardenPrompt(systemPrompt, results) {
  const breaches = results
    .filter((r) => r.status === "breached")
    .map(({ name, category, attackText }) => ({ name, category, attackText }));
  const data = await post("/api/harden", { systemPrompt, breaches });
  return data.hardenedPrompt;
}
