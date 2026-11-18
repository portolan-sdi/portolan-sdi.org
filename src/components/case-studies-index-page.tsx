"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CASE_STUDIES } from "@/lib/case-studies";
import { DirArrow } from "./ui";
import { PageHero } from "./page-hero";
import { SiteShell } from "./site-rail";

export function CaseStudiesIndexPage() {
  const t = useTranslations("case-studies");
  return (
    <SiteShell>
      <PageHero title={t("title")}>
        <p className="mt-6 text-lead leading-relaxed text-p-ink-2">{t("intro")}</p>
      </PageHero>
      <section className="px-[var(--p-pad-section-x)] pb-[var(--p-pad-section-y)] pt-[clamp(28px,3.5vw,48px)]">
        <div className="mx-auto max-w-[1240px]">
          {CASE_STUDIES.map((study) => (
            <article key={study.slug} className="grid grid-cols-1 gap-8 border-b border-p-line pb-10 md:grid-cols-2 md:items-center md:gap-12">
              <Link href={`/case-studies/${study.slug}`} tabIndex={-1} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={study.image} alt={study.imageAlt} width={1240} height={680} className="block aspect-video w-full border border-p-line object-cover" />
              </Link>
              <div>
                <h2>
                  <Link href={`/case-studies/${study.slug}`} className="inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={study.logo} alt={study.title} width={2500} height={600} className="h-12 w-auto max-w-full object-contain brightness-0 sm:h-16" />
                  </Link>
                </h2>
                <p className="mt-4 text-body leading-relaxed text-p-ink-2" dir="ltr">{study.summary}</p>
                <Link href={`/case-studies/${study.slug}`} className="mt-6 inline-flex items-center gap-3 border-b-2 border-p-line pb-1 text-body font-semibold hover:border-p-primary hover:text-p-primary">
                  {t("readStudy")} <DirArrow />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
