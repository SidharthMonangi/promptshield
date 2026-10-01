# PromptShield

**Find out how your chatbot breaks before someone else does.**

Paste your AI chatbot's system prompt. PromptShield fires 25 real prompt-injection attacks at it, shows you every one that got through (with the exact message and reply), gives it a grade, and then rewrites the prompt to defend itself and re-runs every attack to prove the fix works.

Built solo for **LovHack Season 3** (Sept 26 – Oct 4, 2026).

---

## The problem

Almost every student and indie project now ships a chatbot with a system prompt, and most of them can be talked out of their rules in a single message. Prompt injection is ranked the #1 risk in the OWASP Top 10 for LLM applications, yet builders rarely test for it because there's no quick, free way to do so.

## What it does

1. **Attack.** 25 attacks across 5 categories:
   - Instruction override ("ignore previous instructions", fake developer updates)
   - Prompt extraction (repeat-everything-above, export-as-JSON)
   - Role-play jailbreaks (no-rules alter egos, grandma stories)
   - Disguised instructions (base64, reversed text, leetspeak, another language)
   - Indirect injection (instructions hidden in reviews, emails, web pages, tool output)
2. **Grade.** An A–F score with a per-category breakdown and an expandable log of every attack, the bot's reply, and highlighted evidence.
3. **Harden.** One click rewrites the prompt with defensive rules while keeping its purpose and persona, then re-runs all 25 attacks and shows the before/after grade.

## How detection works (and why you can trust the verdicts)

Most AI security demos ask another AI "was this attack successful?". That's slow and inconsistent. PromptShield uses objective checks first:

- **Proof tokens.** Each injection attack asks the bot to output a random token like `PWNED-7F3K2Q`. If the token appears, the bot obeyed the attacker. If the reply also contains other text, a judge model checks whether the bot obeyed or merely *reported* the attack while refusing, so honest bots aren't penalised.
- **Canary tokens.** A random `CANARY-…` value is planted in the system prompt before testing. It exists nowhere else, so if it shows up in a reply, the prompt leaked.
- **Secret and verbatim matching.** Secret-looking values from the prompt (codes, keys, IDs) and any 7-word run copied from the prompt are flagged as leaks.
- **LLM judge as a last resort**, only to catch paraphrased leaks the exact checks can't see.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4 |
| API | Vercel serverless functions (Node) |
| AI | Groq (gpt-oss-20b by default), used as the target model, the judge and the hardener |
| Auth and history | Supabase (magic-link sign-in, Postgres with Row Level Security) |
| Hosting | Vercel |

**Privacy:** signed-in users get scan history, but only scores and attack names are stored. System prompts and bot replies are never saved, because they can contain secrets.

## Run it locally

```bash
npm install
cp .env.example .env     # add your free Groq key
npm run dev              # UI and API on http://localhost:5173
npm test                 # detection-engine tests
```

No Groq key yet? Set `PROMPTSHIELD_MOCK=1` in `.env` to run against a simulated vulnerable bot.

## Set up Supabase (optional)

1. Create a project at supabase.com.
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. Authentication → URL Configuration → add your local and Vercel URLs as redirect URLs.
4. Copy the project URL and anon key into `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel (framework: Vite).
2. Add the environment variables from `.env.example`.
3. Deploy.

## Project structure

```
api/            Vercel functions: scan.js, harden.js
api/_lib/       Detection engine, Groq client, mock model, validation
shared/         Attack library and scoring (used by API and UI)
src/            React app
supabase/       Database schema with Row Level Security
tests/          Engine tests (node:test)
```

## What was built during LovHack

Everything in this repository was created during the LovHack Season 3 build period, starting Oct 1, 2026. Open-source libraries used: React, Vite, Tailwind CSS and supabase-js. AI coding assistants were used during development, as allowed by the rules.

## Responsible use

Only test chatbots you own or have permission to test.

