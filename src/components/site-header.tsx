import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PortolanLogo } from "./portolan-logo";
import { LocaleSwitcher } from "./locale-switcher";

// Minimal chrome: logo, tagline, locale control. Site navigation lives in the
// footer (SiteFooter).
export function SiteHeader() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-30 border-b border-p-line bg-p-bg">
      <div className="flex items-center justify-between gap-6 px-[var(--p-pad-section-x)] py-4">
        <Link href="/" aria-label={t("nav.homeAria")}>
          <PortolanLogo size={28} />
        </Link>
        <div className="flex items-center gap-6">
          <p className="hidden md:block max-w-[360px] font-mono text-micro leading-relaxed text-end text-p-ink">
            {t("nav.tagline")}
            <span className="block text-p-ink-3">{t("nav.taglineMeta")}</span>
          </p>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
