import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DirArrow, Ltr } from "./ui";

// The footer carries the site navigation (the header stays minimal).
// "GitHub" is a product name and stays Latin in every locale.
const navLinks = [
  { href: "/#registry", key: "registry" },
  {
    href: "https://portolan-sdi.github.io/portolan-cli",
    key: "docs",
    external: true,
  },
  {
    href: "https://github.com/portolan-sdi",
    label: "GitHub",
    external: true,
  },
] as const;

const metaLinks = [
  { href: "https://github.com/portolan-sdi", key: "openGovernance" },
  {
    href: "https://github.com/portolan-sdi/portolan/blob/main/LICENSE",
    key: "license",
    latin: true,
  },
  { href: "https://github.com/portolan-sdi/portolan", key: "repo", latin: true },
] as const;

export function SiteFooter() {
  const t = useTranslations();
  const linkClass = "text-p-ink hover:text-p-primary transition-colors";
  const metaLinkClass = "text-p-ink-3 hover:text-p-primary transition-colors";

  return (
    <footer className="px-[var(--p-pad-section-x)] py-[var(--p-pad-xl)] border-t border-p-line text-center">
      <Link
        href="/"
        aria-label={t("nav.homeAria")}
        className="font-mono text-small text-p-primary tracking-[0.06em]"
      >
        <Ltr>( PORTOLAN )</Ltr>
      </Link>
      <nav className="flex flex-wrap justify-center gap-x-7 gap-y-2 mt-5 text-small text-p-ink">
        {navLinks.map((link) => {
          const label = "label" in link ? link.label : t(`nav.${link.key}`);
          const isExternal = "external" in link && link.external;
          return isExternal ? (
            <a key={link.href} href={link.href} className={linkClass}>
              {label} <DirArrow kind="external" />
            </a>
          ) : (
            <Link key={link.href} href={link.href} className={linkClass}>
              {label}
            </Link>
          );
        })}
      </nav>
      <p className="font-mono text-micro text-p-ink-3 mt-5 mb-0">
        {t("nav.tagline")}
      </p>
      <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 mt-2 font-mono text-micro text-p-ink-3">
        {metaLinks.map((link, i) => (
          <span key={link.key} className="flex items-center gap-x-2">
            {i > 0 && <span aria-hidden>·</span>}
            <a href={link.href} className={metaLinkClass}>
              {"latin" in link ? (
                <Ltr>{t(`footer.${link.key}`)}</Ltr>
              ) : (
                t(`footer.${link.key}`)
              )}
            </a>
          </span>
        ))}
      </div>
    </footer>
  );
}
