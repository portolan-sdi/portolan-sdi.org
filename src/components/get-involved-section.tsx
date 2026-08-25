import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { COMMUNITY_LINKS } from "@/lib/site";
import { Ltr, monoChunk } from "./ui";

const proseLink =
  "text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink";

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

export function GetInvolvedSection() {
  const t = useTranslations("getInvolved");

  // Bottom rule only. The talks section above already draws a bottom rule, and
  // a top rule here would stack with it into 2px. The bottom rule stays,
  // because the registry section below carries no top rule.
  return (
    <section
      id="involved"
      className="border-b border-p-line px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)]"
    >
      <div className="mx-auto max-w-[1240px]">
        <h2 className="text-section font-extrabold tracking-[-0.03em] leading-[1.05]">
          {t("title")}
        </h2>
        <div className="mt-6 space-y-5 text-lead leading-relaxed text-p-ink-2">
          <p>
            {t.rich("community", {
              group: (chunks) => (
                <a
                  href={COMMUNITY_LINKS.googleGroup}
                  className={proseLink}
                  {...external}
                >
                  {chunks}
                </a>
              ),
              slack: (chunks) => (
                <a
                  href={COMMUNITY_LINKS.slack}
                  className={proseLink}
                  {...external}
                >
                  {chunks}
                </a>
              ),
              m: (chunks) => <Ltr>{monoChunk(chunks)}</Ltr>,
            })}
          </p>
          <p>
            {t.rich("priority", {
              publish: (chunks) => (
                <Link href="/#how" className={proseLink}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
          <p>
            {t.rich("contributions", {
              github: (chunks) => (
                <a
                  href={COMMUNITY_LINKS.github}
                  className={proseLink}
                  {...external}
                >
                  {chunks}
                </a>
              ),
              issues: (chunks) => (
                <a
                  href={COMMUNITY_LINKS.issues}
                  className={proseLink}
                  {...external}
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
