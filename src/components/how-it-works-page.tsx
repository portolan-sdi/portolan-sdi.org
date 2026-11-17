"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TUTORIALS } from "@/lib/tutorials";
import { GetInvolvedSection } from "./get-involved-section";
import { HowSteps, TOOL_TAGS } from "./home/how-steps";
import { PageHero } from "./page-hero";
import { SiteShell } from "./site-rail";
import { VideoFigure } from "./video-figure";
import { Btn, DirArrow } from "./ui";

// How it works was a homepage section until the homepage kept only the
// quickstart. It now owns the `/how-it-works` route. The page header band
// carries the h1, so the section below it sets no title of its own.
//
// The guides close the page. Guide titles are English in every locale, as on
// the guides index.
export function HowItWorksPage() {
  const t = useTranslations();

  return (
    <SiteShell>
      <PageHero title={t("howItWorks.title")} />

      <section className="px-[var(--p-pad-section-x)] pb-[var(--p-pad-section-y)] pt-[clamp(28px,3.5vw,48px)]">
        <div className="max-w-[1240px] mx-auto">
          <p className="mb-[clamp(2rem,4vw,3rem)] text-lead leading-relaxed text-p-ink-2">
            {t.rich("howItWorks.intro", TOOL_TAGS)}
          </p>

          <HowSteps />

          <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 gap-x-12 gap-y-4 border-t border-p-line pt-7 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <h2 className="text-card-title font-bold tracking-[-0.02em]">
              {t("nav.tutorials")}
            </h2>
            <div className="flex min-w-0 flex-col items-start">
              <ul className="flex flex-col items-start gap-3">
                {TUTORIALS.map((guide) => (
                  <li key={guide.slug}>
                    <Link
                      href={`/tutorials/${guide.slug}`}
                      className="inline-flex items-baseline gap-2 text-body text-p-primary hover:underline"
                    >
                      <span lang="en">{guide.title}</span> <DirArrow />
                    </Link>
                  </li>
                ))}
              </ul>
              <Btn asChild variant="primary" className="mt-7">
                <Link href="/ecosystem" data-track="how-ecosystem">
                  {t("nav.ecosystem")} <DirArrow />
                </Link>
              </Btn>
            </div>
          </div>
        </div>
      </section>

      {/* Portolan in practice. This was a homepage band. The recording
          shows a catalog from the registry in desktop GIS. */}
      <section className="border-t border-p-line px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)]">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-start gap-x-12 gap-y-8 lg:grid-cols-2">
          <div className="min-w-0">
            <h2 className="text-section font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25]">
              {t("practice.title")}
            </h2>
            <p className="mt-5 text-lead leading-relaxed text-p-ink-2">
              {t("practice.lead")}
            </p>
            <p className="mt-5 text-body leading-[1.7] text-p-ink-2">
              {t("practice.items.qgis.body")}
            </p>
          </div>
          <VideoFigure
            src="/video/qgis-pergamino.mp4"
            poster="/img/home/qgis-poster.webp"
            ratio="1132 / 960"
            loop
            muted
            className="min-w-0"
            caption={t("practice.items.qgis.caption")}
            description={t("practice.items.qgis.description")}
          />
        </div>
      </section>

      {/* How to take part. This section was on the homepage until the
          footer took the community links. */}
      <GetInvolvedSection />
    </SiteShell>
  );
}
