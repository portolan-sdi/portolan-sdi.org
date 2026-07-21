"use client";

import { useTranslations } from "next-intl";
import { Card, DirArrow, Ltr, monoChunk } from "./ui";

// The two ways to publish your own catalog (CLI or agent). Rendered inside the
// "How it works" section — there is no separate Quickstart section anymore.
// Browsing existing catalogs isn't a card here; it links straight to the
// registry section at the bottom of the page.
export function PublishPaths() {
  const t = useTranslations();
  const repoLinkClass =
    "mt-auto self-start font-mono text-micro text-p-primary hover:underline";

  return (
    <div className="mt-[clamp(2rem,4vw,3rem)] border-t border-p-line-strong pt-[clamp(1.75rem,3.5vw,2.5rem)]">
      <h3 className="text-card-title-lg font-bold tracking-[-0.02em] mb-6">
        {t("quickstart.title")}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
        <Card className="flex flex-col gap-3">
          <h4 className="text-card-title font-semibold">
            {t("quickstart.cli.title")}
          </h4>
          <p className="text-body leading-relaxed">
            {t.rich("quickstart.cli.description", { m: monoChunk })}
          </p>
          <a href="https://cli.portolan-sdi.org/" className={repoLinkClass}>
            <Ltr>portolan-cli</Ltr> <DirArrow kind="external" />
          </a>
        </Card>

        <Card className="flex flex-col gap-3">
          <h4 className="text-card-title font-semibold">
            {t("quickstart.claude.title")}
          </h4>
          <p className="text-body leading-relaxed">
            {t("quickstart.claude.description")}
          </p>
          <a
            href="https://github.com/portolan-sdi/portolan-skills"
            className={repoLinkClass}
          >
            <Ltr>portolan-skills</Ltr> <DirArrow kind="external" />
          </a>
        </Card>
      </div>

      <a
        href="#registry"
        className="inline-flex items-center gap-2 mt-7 font-mono text-micro text-p-primary hover:underline"
      >
        {t("hero.browseCatalogs")} <DirArrow />
      </a>
    </div>
  );
}
