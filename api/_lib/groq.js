// Minimal Groq client using its OpenAI-compatible endpoint. No SDK needed.
// Retries on rate limits (429) and transient server errors with backoff.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

import { mockChat } from "./mock.js";

export function getModel() {
  if (process.env.PROMPTSHIELD_MOCK === "1") return "mock-model";
  return process.env.GROQ_MODEL || "openai/gpt-oss-20b";
}

// gpt-oss models reason before answering, and the reasoning counts toward the
// token limit. Keep it brief and give the answer room so replies aren't cut off.
function isReasoningModel(model) {
  return model.startsWith("openai/gpt-oss");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function groqChat(messages, { temperature = 0.7, maxTokens = 400, json = false } = {}) {
  if (process.env.PROMPTSHIELD_MOCK === "1") return mockChat(messages, { json });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set on the server.");

  const model = getModel();
  const reasoning = isReasoningModel(model);
  const body = {
    model,
    messages,
    temperature,
    max_tokens: reasoning ? maxTokens + 800 : maxTokens,
    ...(reasoning ? { reasoning_effort: "low" } : {}),
    ...(json ? { response_format: { type: "json_object" } } : {}),
  };

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    }

    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 800 * 2 ** attempt;
      await sleep(Math.min(wait, 8000));
      continue;
    }

    const detail = await res.text().catch(() => "");
    throw new Error(`Groq returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }

  throw new Error("Groq rate limit hit repeatedly. Wait a minute and try again.");
}
