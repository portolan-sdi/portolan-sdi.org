import { useTranslations } from "next-intl";

// The challenge. A solid ink band with no large heading. The ink ground is
// a trial. The band was `--p-primary`. The hero heading already names the
// servers, the databases, and the APIs, so this band does not say them
// again. The eyebrow is the heading of the section. The first paragraph is
// the statement, in the larger size. The second paragraph supports it. The
// base styles give headings and paragraphs their own ink colors, so each one
// names the on-primary tone itself.
export function ChallengeSection() {
  const t = useTranslations("challenge");

  return (
    <section
      id="challenge"
      className="border-t-4 border-p-line px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] bg-p-ink text-p-on-primary"
    >
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-7 items-start">
        <div>
          {/* The eyebrow is the h2, so the section keeps a heading. */}
          <h2 className="font-mono rtl:font-sans! text-eyebrow font-normal tracking-normal text-p-on-primary">
            {t("eyebrow")}
          </h2>
          <p className="mt-4 text-feature font-bold leading-[1.3] rtl:leading-[1.5] tracking-[-0.02em] rtl:tracking-normal text-p-on-primary text-pretty">
            {t("p1")}
          </p>
        </div>
        <p className="max-w-[60ch] text-lead leading-relaxed text-p-on-primary lg:pt-[calc(var(--text-eyebrow)*1.4+1rem)]">
          {t("p2")}
        </p>
      </div>
    </section>
  );
}
