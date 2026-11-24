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
  /**
   * The mark of the publisher, in its own colors, for a light background.
   * The index page shows it in color. The heading of the study and the
   * homepage card are dark, so they show it in one light color.
   */
  logo: string;
  /**
   * Set this only for a mark that exists in white alone. The index page
   * then shows it in `--p-ink`. A color mark is always better.
   */
  inkLogo?: boolean;
  /**
   * The title of the homepage card. The card shows `subtitle` when a study
   * does not set this.
   */
  cardTitle?: string;
  /**
   * A mark for the dark places: the homepage card and the heading of the
   * study. They show `logo` in one light color by default. Set this only
   * when that result is poor, for example for a mark with a solid
   * background.
   */
  cardLogo?: string;
};

/** Case studies are English MDX, separate from the blog and its feed. */
export type CaseStudy = CaseStudyMeta & { slug: string };

// Turbopack resolves this pattern at build time. The keys are the file
// paths, sorted by name.
const FILES = import.meta.glob<{ default: CaseStudyMeta }>(
  "../content/case-studies/*.meta.ts",
  { eager: true },
);

/** Every study, newest first. Studies of one date are in slug order. */
export const CASE_STUDIES: CaseStudy[] = Object.entries(FILES)
  .map(([path, file]) => ({
    ...file.default,
    slug: path.replace(/^.*\//, "").replace(/\.meta\.ts$/, ""),
  }))
  .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((study) => study.slug === slug);
}
