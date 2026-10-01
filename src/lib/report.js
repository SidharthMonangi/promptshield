import { CATEGORIES } from "../../shared/attacks.js";

const categoryName = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));

// Plain-text report for pasting into a README, issue, Slack or Devpost.
export function buildReport({ label, summary, results, after }) {
  const lines = [];
  lines.push(`PromptShield report: ${label || "Untitled bot"}`);
  lines.push(`Grade ${summary.grade} (${summary.score}/100): ${summary.defended} held, ${summary.breached} breached out of ${summary.total} attacks.`);
  if (after) {
    lines.push(`After hardening: grade ${after.summary.grade} (${after.summary.score}/100), ${after.summary.breached} breached.`);
  }
  lines.push("");
  lines.push("By category:");
  for (const c of summary.byCategory) lines.push(`- ${c.name}: ${c.defended}/${c.total} held`);

  const breaches = results.filter((r) => r.status === "breached");
  if (breaches.length) {
    lines.push("");
    lines.push("Attacks that got through:");
    for (const b of breaches) {
      lines.push(`- ${b.name} (${categoryName[b.category]})`);
      lines.push(`  Attacker: ${b.attackText.replace(/\s+/g, " ").slice(0, 220)}`);
      lines.push(`  Bot: ${b.response.replace(/\s+/g, " ").slice(0, 220)}`);
      lines.push(`  Why: ${b.reason}`);
    }
  }
  lines.push("");
  lines.push("Tested with PromptShield: https://promptshield-drab.vercel.app");
  return lines.join("\n");
}
