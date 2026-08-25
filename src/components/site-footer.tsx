import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { COMMUNITY_LINKS, LICENSE_LINKS } from "@/lib/site";
import { PortolanLogo } from "./portolan-logo";
import { Ltr, monoChunk } from "./ui";

const licenseLink = "underline underline-offset-2";

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

const columnLabel = "mb-2 font-mono text-eyebrow text-p-ink-3";
const footLink = "text-p-ink-2 transition-colors hover:text-p-primary";

export function SiteFooter() {
  const t = useTranslations();

  return (
    <footer className="border-t border-p-line px-[var(--p-pad-section-x)] pb-6 pt-10">
      <div className="mx-auto max-w-[1240px]">
        {/* Logo on the inline-start edge, the link columns beside it. The
            rail indexes the page, so every destination that leaves the page
            lives here instead. */}
        <div className="flex flex-col items-start gap-8 sm:flex-row sm:gap-12 lg:gap-20">
          <Link
            href="/"
            aria-label={t("nav.homeAria")}
            className="block w-fit shrink-0"
          >
            <PortolanLogo size={30} />
          </Link>

          <div className="grid w-full grid-cols-1 gap-8 text-start text-small sm:grid-cols-3 sm:gap-10">
            <div>
              <p className={columnLabel}>{t("footer.development")}</p>
              <ul className="flex flex-col items-start gap-1">
                <li>
                  <a
                    href={COMMUNITY_LINKS.roadmap}
                    {...external}
                    className={footLink}
                  >
                    {t("footer.roadmap")}
                  </a>
                </li>
                <li>
                  <a
                    href={COMMUNITY_LINKS.github}
                    {...external}
                    className={footLink}
                  >
                    <Ltr>{t("footer.github")}</Ltr>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className={columnLabel}>{t("footer.community")}</p>
              <ul className="flex flex-col items-start gap-1">
                <li>
                  <a
                    href={COMMUNITY_LINKS.googleGroup}
                    {...external}
                    className={footLink}
                  >
                    {t("footer.googleGroup")}
                  </a>
                </li>
                <li>
                  <a
                    href={COMMUNITY_LINKS.slack}
                    {...external}
                    className={footLink}
                  >
                    <Ltr>{t("footer.slack")}</Ltr>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className={columnLabel}>{t("footer.resources")}</p>
              <ul className="flex flex-col items-start gap-1">
                <li>
                  <Link href="/talks" className={footLink}>
                    {t("nav.talks")}
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className={footLink}>
                    {t("nav.faq")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-12 text-center text-small text-p-ink-3">
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
