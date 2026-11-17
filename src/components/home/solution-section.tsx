import { useTranslations } from "next-intl";
import { monoChunk } from "@/components/ui";
import { FORMAT_TAGS } from "./format-tags";


// The services a publisher runs today, in the order the panel stacks them.
const BEFORE_ITEMS = [
  "mapServer",
  "database",
  "tileServer",
  "api",
  "capacity",
  "operations",
] as const;

// The catalog as a file tree. File and format names are Latin identifiers,
// so they live here and not in messages. A row with no note is a folder. A
// row with a noteKey reads its note from messages.
type TreeRow = {
  name: string;
  note?: string;
  noteKey?: "readme" | "agents";
  nested?: boolean;
};

const TREE: TreeRow[] = [
  { name: "catalog.json", note: "STAC" },
  { name: "README.md", noteKey: "readme" },
  { name: "AGENTS.md", noteKey: "agents" },
  { name: "parcels/" },
  { name: "parcels.parquet", note: "GeoParquet", nested: true },
  { name: "parcels.pmtiles", note: "PMTiles", nested: true },
  { name: "orthophoto/" },
  { name: "2025.tif", note: "COG", nested: true },
];

const BLOCKS = ["standards", "docs", "sovereign"] as const;

const PANEL = "flex flex-col border border-p-line bg-p-bg min-w-0";
const PANEL_BODY =
  "graph-wash flex flex-1 flex-col justify-center p-[clamp(16px,3vw,28px)]";
const PANEL_CAPTION =
  "border-t border-p-line px-[clamp(16px,3vw,28px)] py-4 text-body font-semibold";

// The solution. A two-column head, then two panels that set the services a
// publisher runs today beside the files a Portolan catalog needs, then three
// short blocks. The graph-paper wash runs behind the whole section.
//
// The panels never mirror, so each figure is dir="ltr". Translated text
// inside them takes its own direction with dir="auto".
export function SolutionSection() {
  const t = useTranslations("solution");

  return (
    <section
      id="solution"
      className="graph-wash px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)]"
    >
      <div className="max-w-[1240px] mx-auto flex flex-col gap-[clamp(40px,5vw,56px)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-7 items-start">
          <h2 className="text-section font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25] text-balance">
            {t("title")}
          </h2>
          <div className="flex flex-col gap-5 max-w-[60ch] text-p-ink-2">
            <p className="text-lead leading-relaxed">{t("p1")}</p>
            <p className="text-lead leading-relaxed">{t("p2")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <figure dir="ltr" className={PANEL}>
            <div className={PANEL_BODY}>
              <ul className="flex flex-col gap-3">
                {BEFORE_ITEMS.map((key) => (
                  <li
                    key={key}
                    dir="auto"
                    className="border border-dashed border-p-line bg-p-bg font-mono rtl:font-sans! text-small px-3.5 py-3 [overflow-wrap:anywhere]"
                  >
                    {t(`before.items.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
            <figcaption dir="auto" className={PANEL_CAPTION}>
              {t("before.caption")}
            </figcaption>
          </figure>

          <figure dir="ltr" className={PANEL}>
            <div className={PANEL_BODY}>
              <div className="border border-p-primary bg-p-bg font-mono text-small p-[clamp(14px,2.5vw,20px)]">
                <div className="font-semibold text-p-primary-ink [overflow-wrap:anywhere]">
                  s3://your-bucket/
                </div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {TREE.map((row) => (
                    <li
                      key={row.name}
                      className={`flex flex-wrap gap-x-4 ${
                        row.nested ? "ps-[2ch]" : ""
                      }`}
                    >
                      <span className="text-p-ink sm:min-w-[16ch]">
                        {row.name}
                      </span>
                      {row.noteKey ? (
                        <span dir="auto" className="text-p-ink-3 rtl:font-sans!">
                          {t(`after.notes.${row.noteKey}`)}
                        </span>
                      ) : row.note ? (
                        <span className="text-p-ink-3">{row.note}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <figcaption dir="auto" className={PANEL_CAPTION}>
              {t("after.caption")}
            </figcaption>
          </figure>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
          {BLOCKS.map((key) => (
            <div key={key} className="border-t border-p-line pt-5">
              <h3 className="text-card-title font-bold">
                {t(`blocks.${key}.title`)}
              </h3>
              <p className="text-body text-p-ink-2 mt-3">
                {t.rich(`blocks.${key}.body`, {
                  ...FORMAT_TAGS,
                  m: monoChunk,
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
