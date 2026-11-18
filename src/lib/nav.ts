import { CASE_STUDIES } from "./case-studies";
import { CLI_DOCS_URL } from "./cli-tutorials";
import { COMMUNITY_LINKS, SPEC_URL } from "./site";

// The site map. The top bar and the footer both read this one list, so they
// show the same groups, in the same order, with the same links.
//
// There are four groups. Docs is how to use Portolan. Stories is what
// people made and said. Registry is one link, with no list under it.
// Community is where the people are.

export interface NavItem {
  /** Key under `nav` in the message files. */
  label: string;
  /** A locale-free route, or a full URL when `external` is set. */
  href: string;
  /** The link leaves the site. It opens in a new tab with the ↗ arrow. */
  external?: boolean;
  /** A Latin name that keeps its letter order inside Arabic text. */
  latin?: boolean;
}

export interface NavGroup {
  key: "docs" | "stories" | "registry" | "community";
  /** Key under `nav` in the message files. */
  label: string;
  /** Set for a group that is one link. Such a group has no items. */
  href?: string;
  items: NavItem[];
}

const ALL_GROUPS: NavGroup[] = [
  {
    key: "docs",
    label: "docs",
    items: [
      { label: "quickstart", href: "/quickstart" },
      { label: "tutorials", href: "/tutorials" },
      { label: "faq", href: "/faq" },
      { label: "cliDocs", href: CLI_DOCS_URL, external: true },
      { label: "spec", href: SPEC_URL, external: true },
      { label: "github", href: COMMUNITY_LINKS.github, external: true, latin: true },
    ],
  },
  {
    key: "stories",
    label: "stories",
    items: [
      { label: "caseStudies", href: "/case-studies" },
      { label: "blog", href: "/blog" },
      { label: "talks", href: "/talks" },
    ],
  },
  { key: "registry", label: "registry", href: "/registry", items: [] },
  {
    key: "community",
    label: "community",
    items: [
      { label: "slack", href: COMMUNITY_LINKS.slack, external: true, latin: true },
      { label: "googleGroup", href: COMMUNITY_LINKS.googleGroup, external: true },
    ],
  },
];

/**
 * The groups to show. The case study link shows only when the site has a
 * case study, so no link opens an empty list.
 */
export const NAV_GROUPS: NavGroup[] = ALL_GROUPS.map((group) => ({
  ...group,
  items: group.items.filter(
    (item) => item.href !== "/case-studies" || CASE_STUDIES.length > 0,
  ),
}));

/**
 * The groups of the footer. The footer has no column for a group that is
 * one link, because a head with nothing under it looks empty. Such a link
 * goes into the first group, after its pages and before its outside links.
 */
export const FOOTER_GROUPS: NavGroup[] = (() => {
  const single = NAV_GROUPS.filter((group) => group.href);
  const lists = NAV_GROUPS.filter((group) => !group.href);
  return lists.map((group, index) => {
    if (index !== 0) return group;
    const pages = group.items.filter((item) => !item.external);
    const outside = group.items.filter((item) => item.external);
    const moved = single.map((g) => ({ label: g.label, href: g.href! }));
    return { ...group, items: [...pages, ...moved, ...outside] };
  });
})();
