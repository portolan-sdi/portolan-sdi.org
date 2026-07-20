import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PortolanLogo } from "./portolan-logo";
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

export function SiteFooter() {
  const t = useTranslations();
  const linkClass = "hover:text-p-ink transition-colors";

  return (
    <footer className="px-[var(--p-pad-section-x)] py-[var(--p-pad-lg)] border-t border-p-line text-small text-p-ink-3">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-5">
        <PortolanLogo size={22} />
        <nav className="flex flex-wrap gap-x-7 gap-y-2 text-p-ink-2">
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
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 pt-5 border-t border-p-line-soft">
        <a href="https://github.com/portolan-sdi" className={linkClass}>
          {t("footer.openGovernance")}
        </a>
        <a
          href="https://github.com/portolan-sdi/portolan/blob/main/LICENSE"
          className={linkClass}
        >
          <Ltr>{t("footer.license")}</Ltr>
        </a>
        <a
          href="https://github.com/portolan-sdi/portolan"
          className={linkClass}
        >
          <Ltr>{t("footer.repo")}</Ltr>
        </a>
      </div>
    </footer>
  );
}
