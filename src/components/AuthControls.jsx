import { useEffect, useRef, useState } from "react";
import { sendMagicLink, signOut } from "../lib/supabase.js";

export default function AuthControls({ session }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (session) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden text-ink-soft sm:inline">{session.user.email}</span>
        <button type="button" onClick={signOut} className="font-semibold underline underline-offset-4">
          Sign out
        </button>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setState("sending");
    try {
      await sendMagicLink(email.trim());
      setState("sent");
      setMessage(`Check ${email.trim()} for a sign-in link.`);
    } catch (err) {
      setState("error");
      setMessage(err.message || "Couldn't send the link. Check the email address and try again.");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="whitespace-nowrap rounded-md border-2 border-ink px-3 py-1.5 text-sm font-bold hover:bg-ink hover:text-sheet"
      >
        <span className="sm:hidden">Sign in</span>
        <span className="hidden sm:inline">Sign in to save scans</span>
      </button>
      {open && (
        <form
          onSubmit={submit}
          className="absolute right-0 z-20 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-rule bg-sheet p-4 shadow-[0_8px_24px_rgba(21,35,59,0.14)]"
        >
          <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold">
            Email
          </label>
          <input
            ref={inputRef}
            id="auth-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@college.edu"
            className="mb-3 w-full rounded-md border border-rule bg-paper px-3 py-2"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="w-full rounded-md bg-ink py-2 font-bold text-sheet disabled:opacity-60"
          >
            {state === "sending" ? "Sending link…" : "Email me a sign-in link"}
          </button>
          {message && (
            <p className={`mt-3 text-sm ${state === "error" ? "text-breach" : "text-held"}`} role="status">
              {message}
            </p>
          )}
          <p className="mt-3 text-xs text-ink-soft">
            We save scores and which attacks got through. Your prompt and your bot's replies are never stored.
          </p>
        </form>
      )}
    </div>
  );
}
