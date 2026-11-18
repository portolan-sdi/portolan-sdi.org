import { useTranslations } from "next-intl";
import { Btn, DirArrow } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { PipelineFigure } from "./pipeline-figure";


// The solution. Two columns from `lg`. The text and the two buttons are on
// the inline-start side, and the pipeline figure is on the inline-end side.
// Below `lg` the figure is under the text. The three short blocks are in
// `why-section.tsx`.
//
// The section had two panels that set a publisher's services beside the
// files of a catalog. They left in November 2026, because the hero figure
// shows the same file tree.
export function SolutionSection() {
  const t = useTranslations("solution");
  const tHow = useTranslations("howItWorks");

  return (
    <section
      id="solution"
      className="graph-wash border-t border-p-line px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)]"
    >
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-[clamp(40px,5vw,56px)] items-center">
        <div>
          {/* One of the two eyebrows on the homepage. The other is on the
              challenge section. */}
          <p className="text-small text-p-ink-3">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 text-section font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25] text-balance">
            {t("title")}
          </h2>
          <div className="mt-7 flex flex-col gap-5 max-w-[60ch] text-p-ink-2">
            <p className="text-lead leading-relaxed">{t("p1")}</p>
            <p className="text-lead leading-relaxed">{t("p2")}</p>
            {/* The one way on from here. The quickstart page links to
                the guides. */}
            <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-3">
              <Btn asChild variant="link">
                <Link href="/quickstart" data-track="solution-quickstart">
                  {tHow("quickstart.title")} <DirArrow />
                </Link>
              </Btn>
            </div>
          </div>
        </div>

        <PipelineFigure />
      </div>
    </section>
  );
}
