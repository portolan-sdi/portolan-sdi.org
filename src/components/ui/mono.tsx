import { ReactNode } from "react";

// Renderer for <m> tags in translation strings: typeable identifiers
// (formats, file names, commands) set in the mono voice inside prose.
// Product names (Portolan, DuckDB, ...) stay in the sans voice.
export function monoChunk(chunks: ReactNode) {
  return <code dir="ltr" className="font-mono">{chunks}</code>;
}
