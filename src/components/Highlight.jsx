// Wraps every occurrence of the evidence strings in a highlighter <mark>.
// Matching is case-insensitive and ignores punctuation differences for
// verbatim-overlap evidence (which is stored in normalised lowercase form).
function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termToPattern(term) {
  // Normalised n-grams are space-separated words; allow any non-word glue between them.
  const words = term.split(/\s+/).filter(Boolean).map(escape);
  return words.join("[^a-z0-9]+");
}

export default function Highlight({ text, terms = [] }) {
  if (!terms.length || !text) return text;
  const pattern = new RegExp(`(${terms.map(termToPattern).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="evidence">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
