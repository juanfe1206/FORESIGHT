/**
 * Single source for path panel titles (Story 3.1+). Used by ThinSliceDemo and tests.
 */
export function derivePathLabels(decision: string): [string, string] {
  const d = decision.trim();
  if (!d) return ["Path A", "Path B"];

  const vsMatch = /\s+vs\.?\s+/i.exec(d);
  if (vsMatch) {
    const parts = d.split(vsMatch[0]).map((s) => s.trim());
    if (parts.length >= 2) {
      const a = parts[0].slice(0, 48) || "Path A";
      const b = parts[1].slice(0, 48) || "Path B";
      return [a, b];
    }
  }

  const pipe = d
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (pipe.length >= 2) {
    return [pipe[0].slice(0, 48), pipe[1].slice(0, 48)];
  }

  return ["Path A", "Path B"];
}
