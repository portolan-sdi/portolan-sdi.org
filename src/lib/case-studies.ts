import type { BlogPost } from "./blog";

/**
 * The metadata of one case study. Each study keeps it in its own file,
 * `src/content/case-studies/<slug>.meta.ts`, beside its body
 * `<slug>.mdx`. The file name gives the slug. So a new study adds files
 * and edits no shared file.
 */
export type CaseStudyMeta = Omit<BlogPost, "slug"> & {
  /** The picture on the case study index, as a path under `public/`. */
  image: string;
  imageAlt: string;
  /** The mark of the publisher. It is the heading of the study. */
  logo: string;
  /**
   * The mark shows in one color, `--p-ink`, by default. Set this for a mark
   * that must keep its own colors.
   */
  preserveLogoColors?: boolean;
  /**
   * The key of a card in the homepage case study row. When a study names
   * a card, that card opens the study.
   */
  homeCard?: string;
};

/** Case studies are English MDX, separate from the blog and its feed. */
export type CaseStudy = CaseStudyMeta & { slug: string };

// Turbopack resolves this pattern at build time. The keys are the file
// paths, sorted by name.
const FILES = import.meta.glob<CaseStudyMeta>(
  "../content/case-studies/*.meta.ts",
  { eager: true, import: "default" },
);

/** Every study, newest first. Studies of one date are in slug order. */
export const CASE_STUDIES: CaseStudy[] = Object.entries(FILES)
  .map(([path, meta]) => ({
    ...meta,
    slug: path.replace(/^.*\//, "").replace(/\.meta\.ts$/, ""),
  }))
  .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((study) => study.slug === slug);
}

/** The study that a homepage card opens, if one names that card. */
export function getCaseStudyForCard(card: string): CaseStudy | undefined {
  return CASE_STUDIES.find((study) => study.homeCard === card);
}
