import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Auth is optional: without these env vars the app still works, it just can't save history.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
export const authEnabled = Boolean(supabase);

export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

// Privacy by design: we save the score summary and which attacks got through,
// never the full system prompt or the bot's replies (they may contain secrets).
export async function saveScan({ label, summary, results, hardened }) {
  if (!supabase) return;
  const { error } = await supabase.from("scans").insert({
    label: label.slice(0, 120),
    score: summary.score,
    grade: summary.grade,
    is_hardened: hardened,
    breached_attacks: results.filter((r) => r.status === "breached").map((r) => r.name),
    by_category: summary.byCategory.map(({ id, defended, total }) => ({ id, defended, total })),
  });
  if (error) throw error;
}

export async function listScans() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("scans")
    .select("id, created_at, label, score, grade, is_hardened, breached_attacks")
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw error;
  return data;
}

export async function deleteScan(id) {
  const { error } = await supabase.from("scans").delete().eq("id", id);
  if (error) throw error;
}
