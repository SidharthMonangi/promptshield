// Shared request validation for the API routes.

export const MAX_PROMPT_CHARS = 8000;
export const MIN_PROMPT_CHARS = 20;

export function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return null;
}

export function validatePrompt(systemPrompt) {
  if (typeof systemPrompt !== "string" || !systemPrompt.trim()) {
    return "Paste your chatbot's system prompt to scan it.";
  }
  if (systemPrompt.trim().length < MIN_PROMPT_CHARS) {
    return `The system prompt is too short to test. Add at least ${MIN_PROMPT_CHARS} characters.`;
  }
  if (systemPrompt.length > MAX_PROMPT_CHARS) {
    return `The system prompt is longer than ${MAX_PROMPT_CHARS.toLocaleString()} characters. Shorten it and try again.`;
  }
  return null;
}

export function sendError(res, status, message) {
  res.status(status).json({ error: message });
}

export function modelConfigured() {
  return process.env.PROMPTSHIELD_MOCK === "1" || Boolean(process.env.GROQ_API_KEY);
}

export const NOT_CONFIGURED = "The scanner isn't connected to an AI model yet. The site owner needs to add a GROQ_API_KEY.";
