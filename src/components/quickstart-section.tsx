"use client";

import { useTranslations } from "next-intl";
import { Btn, Card, DirArrow, Ltr, SectionHead } from "./ui";

export function QuickstartSection() {
  const t = useTranslations("quickstart");
  const repoLinkClass =
    "mt-auto self-start font-mono text-micro text-p-primary hover:underline";

  return (
    <section
      id="quickstart"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        <SectionHead
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("intro")}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          <Card className="flex flex-col gap-3">
            <h3 className="text-card-title-lg font-semibold">{t("browse.title")}</h3>
            <p className="text-body leading-relaxed">{t("browse.description")}</p>
            <a href="https://browser.portolan-sdi.org/" className="mt-auto self-start">
              <Btn variant="secondary" size="sm">
                {t("browse.cta")} <DirArrow kind="external" />
              </Btn>
            </a>
          </Card>
          <Card className="flex flex-col gap-3">
            <h3 className="text-card-title-lg font-semibold">{t("cli.title")}</h3>
            <p className="text-body leading-relaxed">{t("cli.description")}</p>
            <a href="https://cli.portolan-sdi.org/" className={repoLinkClass}>
              <Ltr>portolan-cli</Ltr> <DirArrow kind="external" />
            </a>
          </Card>
          <Card className="flex flex-col gap-3">
            <h3 className="text-card-title-lg font-semibold">{t("claude.title")}</h3>
            <p className="text-body leading-relaxed">{t("claude.description")}</p>
            <a
              href="https://github.com/portolan-sdi/portolan-skills"
              className={repoLinkClass}
            >
              <Ltr>portolan-skills</Ltr> <DirArrow kind="external" />
            </a>
          </Card>
        </div>
      </div>
    </section>
  );
}
