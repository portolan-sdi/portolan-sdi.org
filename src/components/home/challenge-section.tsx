import { useTranslations } from "next-intl";

// The challenge. A solid primary band with a two-column head and nothing
// else. The base styles give headings and paragraphs their own ink colors, so
// each one names the on-primary tone itself. White on the blue is 5.3:1.
export function ChallengeSection() {
  const t = useTranslations("challenge");

  return (
    <section
      id="challenge"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] bg-p-primary text-p-on-primary"
    >
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-7 items-start">
        <h2 className="text-p-on-primary text-section font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25] text-balance">
          {t("title")}
        </h2>
        <div className="flex flex-col gap-5 max-w-[60ch]">
          <p className="text-lead leading-relaxed text-p-on-primary">{t("p1")}</p>
          <p className="text-lead leading-relaxed text-p-on-primary">{t("p2")}</p>
        </div>
      </div>
    </section>
  );
}
