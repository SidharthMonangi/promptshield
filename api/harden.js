import { hardenPrompt } from "./_lib/engine.js";
import { groqChat } from "./_lib/groq.js";
import { readJson, validatePrompt, sendError, modelConfigured, NOT_CONFIGURED } from "./_lib/http.js";

// POST /api/harden
// Body: { systemPrompt: string, breaches: [{ name, category, attackText }] }
// Returns: { hardenedPrompt: string }
export default async function handler(req, res) {
  if (req.method !== "POST") return sendError(res, 405, "Use POST.");
  if (!modelConfigured()) return sendError(res, 503, NOT_CONFIGURED);

  const body = readJson(req);
  if (!body) return sendError(res, 400, "Request body must be JSON.");

  const promptError = validatePrompt(body.systemPrompt);
  if (promptError) return sendError(res, 400, promptError);

  const breaches = Array.isArray(body.breaches)
    ? body.breaches
        .slice(0, 25)
        .filter((b) => b && typeof b.name === "string" && typeof b.attackText === "string")
    : [];

  try {
    const hardenedPrompt = await hardenPrompt({ systemPrompt: body.systemPrompt, breaches, llm: groqChat });
    if (!hardenedPrompt) return sendError(res, 502, "The model returned an empty prompt. Try again.");
    res.status(200).json({ hardenedPrompt });
  } catch (err) {
    sendError(res, 500, err.message || "Hardening failed.");
  }
}
