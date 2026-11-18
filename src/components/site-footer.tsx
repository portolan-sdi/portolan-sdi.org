import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FOOTER_GROUPS } from "@/lib/nav";
import { LICENSE_LINKS } from "@/lib/site";
import { PortolanLogo } from "./portolan-logo";
import { Ltr } from "./ui";

// The picture behind the footer. Swap this path to change it, and update
// the image credit in README.md to match. The file is grayscale, and the
// blend below supplies the color.
const FOOTER_IMAGE = "/img/footer/monterrey.webp";

// White text on the band. The focus ring is white too, because the default
// ring can vanish against the blue.
const onBand =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-on-primary";

const licenseLink = `text-p-on-primary underline underline-offset-2 ${onBand}`;

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

// A column head. It is bold, in the body face, so it reads as a head and
// not as one more link.
const columnLabel = "mb-2 font-sans text-body font-bold text-p-on-primary";
const footLink = `inline-flex min-h-6 items-center text-p-on-primary underline-offset-4 hover:underline ${onBand}`;

export function SiteFooter() {
  const t = useTranslations();

  return (
    // `isolate` keeps the blend inside the footer, so the image multiplies
    // with the footer's own blue and not with the page behind it.
    <footer className="relative isolate flex min-h-[clamp(260px,30vw,420px)] flex-col overflow-hidden border-t border-p-line bg-p-primary px-[var(--p-pad-section-x)] pb-6 pt-[clamp(32px,4vw,56px)] text-p-on-primary">
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

      {/* The link columns are at the top of the band, on the inline-end
          side, and the logo is at the top on the inline-start side. The
          license line is at the bottom edge, at the inline-start corner.
          The logo is about as wide as that line. */}
      <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col">
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:justify-between">
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
          {/* The groups of the top bar, in the same order, from
              `src/lib/nav.ts`. The Registry link is in the first column,
              because a column with one link looks empty. */}
          <div className="grid w-full grid-cols-2 gap-8 text-start text-small sm:w-auto sm:grid-cols-[repeat(3,minmax(8.5rem,auto))] sm:gap-12 sm:text-end">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.key}>
                <p className={columnLabel}>{t(`nav.${group.label}`)}</p>
                <ul className="flex flex-col items-start gap-1 sm:items-end">
                  {group.items.map((item) => {
                    const label = item.latin ? (
                      <Ltr>{t(`nav.${item.label}`)}</Ltr>
                    ) : (
                      t(`nav.${item.label}`)
                    );
                    return (
                      <li key={item.href}>
                        {item.external ? (
                          <a href={item.href} {...external} className={footLink}>
                            {label}
                          </a>
                        ) : (
                          <Link href={item.href} className={footLink}>
                            {label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-14">
          <p className="text-eyebrow text-p-on-primary">
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
        </div>
      </div>
    </footer>
  );
}
