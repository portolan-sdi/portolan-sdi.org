import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { COMMUNITY_LINKS, LICENSE_LINKS } from "@/lib/site";
import { PortolanLogo } from "./portolan-logo";
import { Ltr } from "./ui";

// The picture behind the footer. Swap this path to change it, and update
// `footer.imageCredit` in messages/ to match. The file is grayscale: the
// blend below supplies the color.
const FOOTER_IMAGE = "/img/footer/monterrey.webp";

// White text on the band. The focus ring is white too, because the default
// ring can vanish against the blue.
const onBand =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-on-primary";

const licenseLink = `text-p-on-primary underline underline-offset-2 ${onBand}`;

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

const columnLabel = "mb-2 font-mono text-eyebrow text-p-on-primary";
const footLink = `inline-flex min-h-6 items-center text-p-on-primary underline-offset-4 hover:underline ${onBand}`;

export function SiteFooter() {
  const t = useTranslations();

  return (
    // `isolate` keeps the blend inside the footer, so the image multiplies
    // with the footer's own blue and not with the page behind it.
    <footer className="relative isolate flex min-h-[clamp(260px,30vw,420px)] flex-col justify-end overflow-hidden border-t border-p-line bg-p-primary px-[var(--p-pad-section-x)] pb-6 pt-16 text-p-on-primary">
      {/* A grayscale photograph multiplied over the brand blue. Multiply only
          darkens, so no pixel ends up lighter than --p-primary. White text on
          --p-primary is 5.3:1, so white text clears 4.5:1 over every part of
          the picture. The image is decorative and it never mirrors in RTL. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={FOOTER_IMAGE}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover mix-blend-multiply"
      />

      <div className="mx-auto w-full max-w-[1240px]">
        {/* Logo on the inline-start edge, the link columns beside it. The
            rail indexes the page, so every destination that leaves the page
            lives here instead. The logo sits above the columns until lg: from
            md the pinned rail narrows the content, and beside the logo a
            column is too narrow for one long word such as "demostraciones". */}
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:gap-20">
          <Link
            href="/"
            aria-label={t("nav.homeAria")}
            className={`block w-fit shrink-0 ${onBand}`}
          >
            {/* The mark and wordmark turn white here. The blue mark would
                disappear into the blue band. */}
            <PortolanLogo
              size={30}
              className="text-p-on-primary! [&_g]:fill-p-on-primary"
            />
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
                  <Link href="/blog" className={footLink}>
                    {t("nav.blog")}
                  </Link>
                </li>
                <li>
                  <Link href="/tutorials" className={footLink}>
                    {t("nav.tutorials")}
                  </Link>
                </li>
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

        <p className="mt-12 text-center text-small text-p-on-primary">
          {t.rich("footer.contentLicense", {
            cc: (chunks) => (
              <a href={LICENSE_LINKS.content} className={licenseLink}>
                <Ltr>{chunks}</Ltr>
              </a>
            ),
          })}{" "}
          ·{" "}
          {t.rich("footer.sourceLicense", {
            apache: (chunks) => (
              <a href={LICENSE_LINKS.source} className={licenseLink}>
                <Ltr>{chunks}</Ltr>
              </a>
            ),
          })}
        </p>

        <p className="mt-3 text-center font-mono text-eyebrow text-p-on-primary">
          {t("footer.imageCredit")}
        </p>
      </div>
    </footer>
  );
}
