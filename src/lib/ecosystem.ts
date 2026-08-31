// The Portolan ecosystem index. Every tool that implements or extends the
// specification lives in this one list, so the homepage section and a future
// /ecosystem page read the same entries. Adding a tool is one line here.
//
// Only tools that implement Portolan itself belong in the list. Interoperable
// software that merely reads the formats (query engines, desktop GIS,
// libraries) is NOT part of Portolan and lives in How-it-works.
//
// Names and SPDX license ids stay Latin in every locale. The one-line role is
// translated, under `ecosystem.projects.<slug>` in `messages/*.json`.

// `core` is a first-party Portolan project. `community` is a third-party open
// tool that works with catalogs. `commercial` is a product a company sells on
// the open core. A commercial entry names no license and links to the vendor.
export type EcosystemTier = "core" | "community" | "commercial";

/** Tier order in the filter row. Open work comes before paid work. */
export const ECOSYSTEM_TIERS: readonly EcosystemTier[] = [
  "core",
  "community",
  "commercial",
];

/** The filter row adds an "all" state in front of the tiers. */
export type EcosystemFilter = "all" | EcosystemTier;

export interface EcosystemEntry {
  /** Key under `ecosystem.projects` in the message files. */
  slug: string;
  /** Latin in every locale. Never translated. */
  name: string;
  /** SPDX id, or null when the entry ships no open license. */
  license: string | null;
  tier: EcosystemTier;
  href: string;
}

// Order is editorial, not alphabetical or ranked. The unfiltered first page
// shows one entry from each tier that has members, so a reader who never
// touches the filter still sees that the ecosystem is wider than the core.
// Move an entry up or down this list to change which page it lands on.
export const ECOSYSTEM_ENTRIES: readonly EcosystemEntry[] = [
  { slug: "spec", name: "portolan-spec", license: "Apache-2.0", tier: "core", href: "https://github.com/portolan-sdi/portolan-spec" },
  { slug: "rashid", name: "rashid", license: "Apache-2.0", tier: "core", href: "https://github.com/portolan-sdi/rashid" },
  { slug: "cli", name: "portolan-cli", license: "Apache-2.0", tier: "core", href: "https://github.com/portolan-sdi/portolan-cli" },
  { slug: "registry", name: "portolan-registry", license: "Apache-2.0", tier: "core", href: "https://github.com/portolan-sdi/portolan-registry" },
  { slug: "skills", name: "portolan-skills", license: null, tier: "core", href: "https://github.com/portolan-sdi/portolan-skills" },
  // CARTO SDI links to carto.com until its own product page exists.
  { slug: "cartosdi", name: "CARTO SDI", license: null, tier: "commercial", href: "https://carto.com/" },
  { slug: "browser", name: "portolan-browser", license: "ISC", tier: "core", href: "https://github.com/portolan-sdi/portolan-browser" },
];

/**
 * Cards per page. Six fills exactly two rows of the three-column grid at `lg`,
 * so a full page never leaves a short trailing row. A future /ecosystem page
 * differs from the homepage section only in this number.
 */
export const ECOSYSTEM_PAGE_SIZE = 6;

export function entriesInFilter(filter: EcosystemFilter): EcosystemEntry[] {
  if (filter === "all") return [...ECOSYSTEM_ENTRIES];
  return ECOSYSTEM_ENTRIES.filter((entry) => entry.tier === filter);
}

// TODO(nlebovits): confirm the real destination for "submit a tool". The org
// landing is a real, non-dead target for now — swap for a dedicated
// contribute/awesome-list page or issue template once one exists.
export const ECOSYSTEM_SUBMIT_HREF = "https://github.com/portolan-sdi";
