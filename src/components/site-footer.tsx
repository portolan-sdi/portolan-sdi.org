import { useTranslations } from "next-intl";
import { PortolanLogo } from "./portolan-logo";
import { Ltr } from "./ui";

export function SiteFooter() {
  const t = useTranslations();
  const linkClass = "hover:text-p-ink transition-colors";
  return (
    <footer className="px-[var(--p-pad-section-x)] py-[var(--p-pad-lg)] border-t border-p-line-soft flex flex-col gap-5 text-small text-p-ink-3">
      <p>{t("footer.colophon")}</p>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <PortolanLogo size={22} />
        <div className="flex flex-wrap gap-x-6 gap-y-2">
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
      </div>
    </footer>
  );
}
