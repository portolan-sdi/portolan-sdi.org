import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PortolanLogo } from "./portolan-logo";
import { DirArrow } from "./ui";

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

export function SiteFooter() {
  const t = useTranslations();
  const linkClass = "text-p-ink hover:text-p-primary transition-colors";

  return (
    <footer className="px-[var(--p-pad-section-x)] py-[var(--p-pad-xl)] border-t border-p-line text-center">
      <Link
        href="/"
        aria-label={t("nav.homeAria")}
        className="inline-flex justify-center"
      >
        <PortolanLogo size={24} />
      </Link>
      <nav className="flex flex-wrap justify-center gap-x-7 gap-y-2 mt-5 font-mono text-micro text-p-ink">
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
    </footer>
  );
}
