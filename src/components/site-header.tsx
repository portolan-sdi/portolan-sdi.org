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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-[var(--p-pad-section-x)] py-4">
        <Link href="/" aria-label={t("nav.homeAria")} className="justify-self-start">
          <PortolanLogo size={28} />
        </Link>
        <p className="hidden md:block font-mono text-micro text-center text-p-ink m-0">
          {t("nav.tagline")}
        </p>
        <div className="justify-self-end">
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
