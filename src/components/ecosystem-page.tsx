"use client";

import { useTranslations } from "next-intl";
import { EcosystemSection } from "./ecosystem-section";
import { PageHero } from "./page-hero";
import { SiteShell } from "./site-rail";

// The tool list was a homepage section until "Portolan in practice" took
// its place there. It now owns the `/ecosystem` route. The page header band
// carries the h1, so the section below it sets no title of its own.
export function EcosystemPage() {
  const t = useTranslations("ecosystem");

  return (
    <SiteShell>
      <PageHero title={t("title")} />
      <EcosystemSection />
    </SiteShell>
  );
}
