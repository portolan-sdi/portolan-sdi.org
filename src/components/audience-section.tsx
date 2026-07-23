import { useTranslations } from "next-intl";
import { DirArrow, SectionHead } from "./ui";

// "Portolan was created for" — three audience cells sitting right under the
// hero, the first concrete thing after the thesis. Modeled on STAC's "created
// for" trio, but rendered in Portolan's editorial style: one near-black frame
// with soft interior rules, no fills, no rounded corners. Audiences are not a
// sequence, so no numbers. Each cell ends in a single blue CTA that opens the
// closest live proof (a national-archive agent demo, the cost calculator, the
// catalog browser) until dedicated audience pages exist.
const audiences = [
  { key: "large", href: "https://jatorre.github.io/carto-ogc-helsinki/webapp/" },
  { key: "small", href: "https://cholmes.github.io/open-geodag-presentation/calculator.html" },
  { key: "users", href: "https://browser.portolan-sdi.org/" },
] as const;

export function AudienceSection() {
  const t = useTranslations("audiences");

  return (
    <section
      id="audiences"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-b border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        <SectionHead eyebrow={t("eyebrow")} title={t("title")} wide />

        {/* Three cells in one near-black frame. Interior dividers switch from
            bottom rules (stacked) to start rules (row) at md, matching the
            how-it-works stepper. Faint tint on hover; the CTA anchors to the
            bottom of every cell so ragged body lengths still line up. */}
        <div className="border border-p-line-strong grid grid-cols-1 md:grid-cols-3">
          {audiences.map((a) => (
            <div
              key={a.key}
              className="group flex flex-col p-[26px] border-p-line transition-colors duration-300
                border-b [&:last-child]:border-b-0
                md:border-b-0
                md:[&:not(:first-child)]:border-s
                hover:bg-[color-mix(in_srgb,var(--p-primary)_4%,var(--p-paper))]"
            >
              <h3 className="text-card-title font-bold tracking-[-0.02em]">
                {t(`cards.${a.key}.title`)}
              </h3>
              <p className="text-body text-p-ink-2 leading-relaxed text-pretty mt-3">
                {t(`cards.${a.key}.body`)}
              </p>
              <a
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto pt-5 font-mono text-micro text-p-primary hover:underline inline-flex items-center gap-1.5"
              >
                {t(`cards.${a.key}.cta`)} <DirArrow kind="external" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
