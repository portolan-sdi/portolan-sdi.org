import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { COMMUNITY_LINKS, LICENSE_LINKS } from "@/lib/site";
import { PortolanLogo } from "./portolan-logo";
import { Ltr, monoChunk } from "./ui";

const licenseLink =
  "underline underline-offset-2";

export function SiteFooter() {
  const t = useTranslations();

  return (
    <footer className="px-[var(--p-pad-section-x)] pb-6 pt-10">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:gap-10">
          <Link href="/" aria-label={t("nav.homeAria")} className="w-fit">
            <PortolanLogo size={30} />
          </Link>

          <div className="text-start text-small">
            <p className="mb-2 font-mono text-eyebrow text-p-ink-3">
              {t("footer.contact")}
            </p>
            <div className="flex flex-col items-start gap-1">
              <a
                href={COMMUNITY_LINKS.googleGroup}
                className="text-p-ink-2 transition-colors hover:text-p-primary"
              >
                {t("footer.googleGroup")}
              </a>
              <a
                href={COMMUNITY_LINKS.slack}
                className="text-p-ink-2 transition-colors hover:text-p-primary"
              >
                <Ltr>{t.rich("footer.slack", { m: monoChunk })}</Ltr>
              </a>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-small text-p-ink-3">
          {t.rich("footer.contentLicense", {
            m: monoChunk,
            cc: (chunks) => (
              <a href={LICENSE_LINKS.content} className={licenseLink}>
                <Ltr>{chunks}</Ltr>
              </a>
            ),
          })}{" "}
          ·{" "}
          {t.rich("footer.sourceLicense", {
            m: monoChunk,
            apache: (chunks) => (
              <a href={LICENSE_LINKS.source} className={licenseLink}>
                <Ltr>{chunks}</Ltr>
              </a>
            ),
          })}
        </p>
      </div>
    </footer>
  );
}
