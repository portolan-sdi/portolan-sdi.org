// Decorative inline arrow that mirrors in RTL so it always points in the
// reading-forward direction (→ becomes ←, ↗ becomes ↖). aria-hidden.
//
// The arrow always sets in the mono face, in every kind of link. The mono
// arrow has a body that is longer than its head. The arrow of the body
// face is short, and the site does not use it.
export function DirArrow({ kind = "forward" }: { kind?: "forward" | "external" }) {
  return (
    <span aria-hidden className="inline-block font-mono font-normal rtl:-scale-x-100">
      {kind === "external" ? "↗" : "→"}
    </span>
  );
}
