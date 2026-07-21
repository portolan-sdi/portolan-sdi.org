"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { DirArrow, Ltr, monoChunk } from "./ui";

// The two ways to publish your own catalog (CLI or agent). Rendered inside the
// "How it works" section — there is no separate Quickstart section anymore.
// Browsing existing catalogs isn't a card; the header links straight to the
// registry section at the bottom of the page. Each card is itself the link to
// its repo, with the ecosystem cards' hard blue offset-shadow lift on hover.
const cardClass =
  "ec-card group flex flex-col gap-2.5 border border-p-line bg-p-paper p-[26px]";

function PathCard({
  href,
  glyph,
  title,
  body,
  repo,
}: {
  href: string;
  glyph: ReactNode;
  title: string;
  body: ReactNode;
  repo: string;
}) {
  return (
    <a href={href} className={cardClass}>
      <div className="flex items-center gap-3">
        <span aria-hidden className="font-mono text-body text-p-primary">
          {glyph}
        </span>
        <h4 className="text-card-title font-bold tracking-[-0.02em]">{title}</h4>
      </div>
      <p className="text-body text-p-ink-2 leading-relaxed">{body}</p>
      <span className="mt-2 font-mono text-micro text-p-primary group-hover:underline">
        <Ltr>{repo}</Ltr> <DirArrow kind="external" />
      </span>
    </a>
  );
}

export function PublishPaths() {
  const t = useTranslations();

  return (
    <div className="mt-[clamp(2.5rem,5vw,3.5rem)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 mb-6">
        <h3 className="text-card-title-lg font-bold tracking-[-0.02em]">
          {t("quickstart.title")}
        </h3>
        <a
          href="#registry"
          className="font-mono text-micro text-p-primary whitespace-nowrap hover:underline"
        >
          {t("hero.browseCatalogs")} <DirArrow />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PathCard
          href="https://cli.portolan-sdi.org/"
          glyph=">_"
          title={t("quickstart.cli.title")}
          body={t.rich("quickstart.cli.description", { m: monoChunk })}
          repo="portolan-cli"
        />
        <PathCard
          href="https://github.com/portolan-sdi/portolan-skills"
          glyph={"✳︎"}
          title={t("quickstart.claude.title")}
          body={t("quickstart.claude.description")}
          repo="portolan-skills"
        />
      </div>
    </div>
  );
}
