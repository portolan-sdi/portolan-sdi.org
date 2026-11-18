import type { BlogPost } from "./blog";

/** Case studies are English MDX, separate from the blog and its feed. */
export type CaseStudy = BlogPost & {
  image: string;
  imageAlt: string;
  logo: string;
  preserveLogoColors?: boolean;
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "geoconnex",
    title: "Lincoln Institute of Land Policy",
    subtitle: "Connecting water data with GeoConnex",
    date: "2026-11-18",
    summary: "The Lincoln Institute's Center for Geospatial Solutions publishes GeoConnex water data as a Portolan catalog. Draft for Colton Loftus.",
    image: "/img/case-studies/geoconnex-colorado.jpg",
    imageAlt: "GeoConnex stream gages and river-basin boundaries around Denver and Boulder, Colorado, on a labeled map.",
    logo: "/img/case-studies/lincoln-color-logo.png",
    preserveLogoColors: true,
  },
  {
    slug: "epoch-blue",
    title: "Epoch Blue",
    subtitle: "Making public forest data usable",
    date: "2026-11-18",
    summary: "Jake Wilkins republishes forest data on Source Cooperative with Portolan and builds a browser explorer on top.",
    image: "/img/case-studies/epoch-explorer.jpg",
    imageAlt: "Jake Wilkins's viewer showing ForTy forest types over South Papua.",
    logo: "/img/case-studies/epoch-logo.svg",
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((study) => study.slug === slug);
}
