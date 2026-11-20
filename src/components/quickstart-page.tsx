"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PostCodeBlock } from "./blog/post-code-block";
import { Btn, DirArrow } from "./ui";
import { HowSteps, TOOL_TAGS } from "./home/how-steps";
import { PageHero } from "./page-hero";
import { SiteShell } from "./site-rail";

// Getting started. It owns the `/quickstart` route. The page header carries
// the h1, so the section below it sets no title of its own.
//
// The page has three parts and no lead paragraph. First, the two steps that
// the reader does: install the skills, then give the agent the data and a
// bucket. Second, `HowSteps`: the recording of the Philadelphia catalog
// beside the four things the agent then does. Third, a next steps block
// that links the East Hampton guide and its catalog. The page is short on
// purpose. It has no list of guides, because the Docs menu has them, and
// no tool list, because each tool is a link in the sentence that names it.

const SKILLS_URL = "https://github.com/portolan-sdi/portolan-skills";

// The next steps block at the bottom links the East Hampton guide, and its
// sentence links the catalog that the guide builds, open in the browser.
const EAST_HAMPTON_GUIDE = "/tutorials/mirroring-east-hampton";
const EAST_HAMPTON_CATALOG =
  "https://browser.portolan-sdi.org/#/external/data.source.coop/portolan-mirrors/east-hampton-catalog/catalog.json";

// The same commands as in the README of portolan-skills. Verify a command
// there before you change it here.
const INSTALL = `claude plugin marketplace add portolan-sdi/portolan-skills
claude plugin install portolan@portolan-skills`;

// An example prompt. The reader brings two things: the data and a bucket.
// It stays English in every locale, as a prompt in a guide does.
const PROMPT = `Use the Portolan bootstrap skill to make a catalog of these data:
<the URL of your data>

Publish it to this bucket:
<s3://your-bucket/>`;

const proseLink =
  "text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink";

const TAGS = {
  ...TOOL_TAGS,
  install: (chunks: ReactNode) => (
    <a href={`${SKILLS_URL}#installation`} className={proseLink}>
      {chunks}
    </a>
  ),
  catalog: (chunks: ReactNode) => (
    <a
      href={EAST_HAMPTON_CATALOG}
      target="_blank"
      rel="noopener noreferrer"
      data-track="quickstart-next-east-hampton-catalog"
      className={proseLink}
    >
      {chunks}
    </a>
  ),
};

export function QuickstartPage() {
  const t = useTranslations();
  const q = (key: string) => t.rich(`howItWorks.quickstart.${key}`, TAGS);

  return (
    <SiteShell>
      <PageHero title={t("howItWorks.quickstart.title")} />

      <section className="px-[var(--p-pad-section-x)] pb-[var(--p-pad-section-y)] pt-[clamp(28px,3.5vw,48px)]">
        <div className="mx-auto max-w-[1240px]">
          {/* The two steps of the reader, one under the other. From lg
              each step is one row: the numeral, the title, and the text
              take two fifths of the width, and the code takes three
              fifths, so no line of code breaks. Below lg the code is under
              the text. */}
          <ol className="mb-[clamp(3rem,6vw,5rem)] flex flex-col gap-y-[clamp(2rem,4vw,3rem)]">
            {(["install", "start"] as const).map((step, index) => (
              <li
                key={step}
                className="grid min-w-0 grid-cols-1 items-start gap-x-12 gap-y-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
              >
                <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-[clamp(16px,2vw,28px)]">
                  <span
                    aria-hidden="true"
                    className="text-hero font-extrabold leading-[0.8] tracking-[-0.04em] text-p-primary"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-feature font-bold leading-[1.15] tracking-[-0.02em] rtl:tracking-normal">
                      <span className="sr-only">
                        {t("howItWorks.quickstart.step", { n: index + 1 })}{" "}
                      </span>
                      {t(`howItWorks.quickstart.${step}.title`)}
                    </h2>
                    <p className="mt-3 text-body leading-relaxed text-p-ink-2">
                      {q(`${step}.body`)}
                    </p>
                  </div>
                </div>
                {/* The code block sets its own top margin for a post body.
                    A row has none. */}
                <div className="min-w-0 [&>div]:mt-0">
                  <PostCodeBlock>
                    <code className="font-mono" lang="en">
                      {step === "install" ? INSTALL : PROMPT}
                    </code>
                  </PostCodeBlock>
                </div>
              </li>
            ))}
          </ol>

          {/* What the agent then does, beside the recording of it. */}
          <HowSteps />

          {/* Next steps, at the bottom of the page, after one rule. One
              text link opens the East Hampton guide. */}
          <div className="mt-[clamp(3rem,6vw,5rem)] border-t border-p-line pt-[clamp(28px,3.5vw,48px)]">
            <div className="max-w-[68ch]">
              <h2 className="text-feature font-bold leading-[1.15] tracking-[-0.02em] rtl:tracking-normal">
                {t("howItWorks.quickstart.nextSteps.title")}
              </h2>
              <p className="mt-3 text-body leading-relaxed text-p-ink-2">
                {q("nextSteps.body")}
              </p>
              <div className="mt-6">
                <Btn asChild variant="link">
                  <Link href={EAST_HAMPTON_GUIDE} data-track="quickstart-next-east-hampton">
                    {t("howItWorks.quickstart.nextSteps.cta")} <DirArrow />
                  </Link>
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
