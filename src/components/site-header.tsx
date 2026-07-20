import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PortolanLogo } from "./portolan-logo";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";

// Minimal chrome: logo and controls only. Site navigation lives in the
// footer (SiteFooter).
export function SiteHeader() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-30 border-b border-p-line bg-p-bg">
      <div className="flex items-center justify-between px-[var(--p-pad-section-x)] py-4">
        <Link href="/" aria-label={t("nav.homeAria")}>
          <PortolanLogo size={28} />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
