import { ATTACK_IDS } from "../shared/attacks.js";
import { runScan } from "./_lib/engine.js";
import { groqChat, getModel } from "./_lib/groq.js";
import { readJson, validatePrompt, sendError, modelConfigured, NOT_CONFIGURED } from "./_lib/http.js";

// POST /api/scan
// Body: { systemPrompt: string, attackIds: string[] (max 10 per request) }
// The frontend sends attacks in small batches so it can show live progress and
// stay well inside serverless time limits.
export default async function handler(req, res) {
  if (req.method !== "POST") return sendError(res, 405, "Use POST.");
  if (!modelConfigured()) return sendError(res, 503, NOT_CONFIGURED);

  const body = readJson(req);
  if (!body) return sendError(res, 400, "Request body must be JSON.");

  const promptError = validatePrompt(body.systemPrompt);
  if (promptError) return sendError(res, 400, promptError);

  const ids = Array.isArray(body.attackIds) ? body.attackIds.filter((id) => ATTACK_IDS.includes(id)) : [];
  if (!ids.length) return sendError(res, 400, "Choose at least one valid attack to run.");
  if (ids.length > 10) return sendError(res, 400, "Send at most 10 attacks per request.");

  try {
    const results = await runScan({ systemPrompt: body.systemPrompt, attackIds: ids, llm: groqChat });
    res.status(200).json({ model: getModel(), results });
  } catch (err) {
    sendError(res, 500, err.message || "The scan failed.");
  }
}
