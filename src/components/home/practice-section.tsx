import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { VideoFigure } from "../video-figure";

// Portolan in practice. Four ways to use one catalog, on a solid ink band.
//
// Each item is a framed figure with a mono caption row, then a title, then
// at most one paragraph. The anatomy is ragged on purpose: the browser item
// carries no paragraph. Two items hold a still and two hold a recording.
//
// The media sits on the page color inside the dark band, so the screenshots
// keep their light look. Media frames pin LTR because they capture LTR
// interfaces. Captions are translated copy and follow the page direction.

const FRAME = "m-0 border border-p-bg/40 bg-p-bg";
const CAPTION =
  "border-t border-p-line bg-p-bg px-4 py-3 font-mono text-eyebrow leading-relaxed text-p-ink-2";

// The encoded shape of the QGIS recording and its poster.
const QGIS_RATIO = "1132 / 960";

function Item({
  figure,
  title,
  body,
}: {
  figure: ReactNode;
  title: string;
  body?: string;
}) {
  return (
    // The floor lets a grid track shrink below the intrinsic media width.
    <div className="min-w-0">
      {figure}
      <h3 className="mt-5 text-feature font-bold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25] text-p-bg">
        {title}
      </h3>
      {body && (
        <p className="mt-3 max-w-[60ch] text-body leading-[1.7] text-p-bg/80 text-pretty">
          {body}
        </p>
      )}
    </div>
  );
}

export function PracticeSection() {
  const t = useTranslations("practice");

  return (
    <section
      id="use"
      className="bg-p-ink text-p-bg px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)]"
    >
      <div className="max-w-[1240px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-7 items-start">
          <h2 className="text-p-bg text-section font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25] text-balance">
            {t("title")}
          </h2>
          <p className="max-w-[60ch] text-lead leading-relaxed text-p-bg text-pretty">
            {t("lead")}
          </p>
        </div>

        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-14 items-start">
          <Item
            title={t("items.browser.title")}
            figure={
              <figure className={FRAME}>
                <div dir="ltr">
                  {/* A plain img. The file is a static screenshot that
                      already ships at display size. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/video/portolan-demo-one.jpg"
                    alt={t("items.browser.alt")}
                    width={1454}
                    height={1118}
                    loading="lazy"
                    decoding="async"
                    className="block w-full aspect-[1132/960] object-cover object-left-top"
                  />
                </div>
                <figcaption className={CAPTION}>
                  {t("items.browser.caption")}
                </figcaption>
              </figure>
            }
          />

          <Item
            title={t("items.qgis.title")}
            body={t("items.qgis.body")}
            figure={
              // The player renders its own figure, so the frame and the
              // caption row pass in as classes and nothing nests.
              <VideoFigure
                src="/video/qgis-pergamino.mp4"
                poster="/img/home/qgis-poster.webp"
                ratio={QGIS_RATIO}
                loop
                muted
                plain
                className={FRAME}
                caption={t("items.qgis.caption")}
                captionClassName={CAPTION}
                description={t("items.qgis.description")}
              />
            }
          />

          <Item
            title={t("items.app.title")}
            body={t("items.app.body")}
            figure={
              <figure className={FRAME}>
                <div dir="ltr">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/video/firms-explorer.webp"
                    alt={t("items.app.alt")}
                    width={1448}
                    height={720}
                    loading="lazy"
                    decoding="async"
                    className="block w-full aspect-[16/10] object-cover object-right"
                  />
                </div>
                <figcaption className={CAPTION}>
                  {t("items.app.caption")}
                </figcaption>
              </figure>
            }
          />

          <Item
            title={t("items.agent.title")}
            body={t("items.agent.body")}
            figure={
              // A still from the recorded run an agent made against the live
              // registry. The file is the top of one frame of
              // `portolan-demo-two.mp4`, so the question is readable.
              <figure className={FRAME}>
                <div dir="ltr">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/img/home/agent-flood-risk.webp"
                    alt={t("items.agent.alt")}
                    width={1194}
                    height={746}
                    loading="lazy"
                    decoding="async"
                    className="block h-auto w-full"
                  />
                </div>
                <figcaption className={CAPTION}>
                  {t("items.agent.caption")}
                </figcaption>
              </figure>
            }
          />
        </div>
      </div>
    </section>
  );
}
