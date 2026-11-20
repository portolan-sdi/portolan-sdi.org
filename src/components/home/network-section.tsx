"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RegistryMapEmbed } from "@/components/registry/registry-map-embed";
import { RegistryCounts } from "@/components/registry/registry-counts";
import type { MapState } from "@/components/registry/catalog-map";
import type { CoverageIndex } from "@/lib/collection-points";
import { catalogsInView, type CountedCatalog } from "@/lib/registry-view";

// The registry, between the case studies and the about section. Its one
// job is to send the reader to `/registry`.
//
// The section is a solid `--p-ink` band. Two columns from `lg`. The text
// is on the inline-start side. The live registry map is on the inline-end
// side, in a plain frame. Below `lg` the map is under the text.
//
// The map is the real one from `/registry`, without its search and its
// cards. A click on a point opens the registry at that catalog. The two
// controls of the section are on the map, as two square icons on the
// inline-start side. The one at the top opens the full registry. The one
// at the bottom shows the map on the full screen. The words "Portolan
// registry" in the text are a link to the registry also.
const MAP_BTN =
  "absolute start-3 z-10 flex h-9 w-9 items-center justify-center border border-p-line bg-p-paper text-p-ink-2 transition-colors hover:bg-p-bg-soft hover:text-p-ink";

/** The answer of the browser does not change, so nothing subscribes. */
const NEVER_CHANGES = () => () => {};

interface NetworkSectionProps {
  /** The registry listing, cut to the fields of the count line. */
  catalogs: CountedCatalog[];
}

export function NetworkSection({ catalogs }: NetworkSectionProps) {
  const t = useTranslations("network");
  const frameRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);

  // The count line under the map follows the map view, as it does on
  // `/registry`. Before the map loads, it counts every catalog.
  const [view, setView] = useState<{
    index: CoverageIndex;
    state: MapState | null;
  } | null>(null);
  const handleView = useCallback(
    (index: CoverageIndex, state: MapState | null) => setView({ index, state }),
    []
  );
  const inView = useMemo(
    () => catalogsInView(catalogs, view?.index ?? null, view?.state?.viewport ?? null),
    [catalogs, view]
  );
  // Some phones cannot show one element on the full screen. The button
  // shows only where the browser can.
  const canFull = useSyncExternalStore(
    NEVER_CHANGES,
    () => document.fullscreenEnabled,
    () => false,
  );

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFull() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frameRef.current?.requestFullscreen();
  }

  return (
    <section
      id="network"
      className="border-t border-p-line bg-p-ink px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] text-p-on-primary"
    >
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-x-16 gap-y-[clamp(40px,5vw,56px)] items-center">
        <div>
          <h2 className="text-section font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25] text-balance text-p-on-primary">
            {t("title")}
          </h2>
          <p className="mt-7 max-w-[60ch] text-lead leading-relaxed text-p-on-primary">
            {t.rich("body", {
              reg: (chunks) => (
                <Link
                  href="/registry"
                  data-track="network-registry-text"
                  className="text-p-on-primary underline underline-offset-4 decoration-1 hover:decoration-2"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>

        {/* The map keeps the page colors inside its frame. The frame is
            plain: the light map on the ink band needs no block behind it. */}
        <div className="text-p-ink">
          <div ref={frameRef} className="relative bg-p-bg">
            <RegistryMapEmbed
              frameClassName={full ? "h-screen" : "h-[320px] sm:h-[360px] lg:h-[400px]"}
              onView={handleView}
            />
            {/* Two square controls, in the style of the zoom buttons of
                the map. The one at the top opens the registry. The one at
                the bottom shows the map on the full screen. */}
            <Link
              href="/registry"
              data-track="network-registry"
              aria-label={t("link")}
              title={t("link")}
              className={`${MAP_BTN} top-3`}
            >
              <span aria-hidden="true" className="inline-block font-mono text-body leading-none rtl:-scale-x-100">
                ↗
              </span>
            </Link>
            {canFull && (
              <button
                type="button"
                onClick={toggleFull}
                aria-label={t(full ? "exitFullscreen" : "fullscreen")}
                title={t(full ? "exitFullscreen" : "fullscreen")}
                className={`${MAP_BTN} bottom-3 cursor-pointer`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
                  {full ? (
                    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                  ) : (
                    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                  )}
                </svg>
              </button>
            )}
          </div>
          {/* The same count line as under the map on `/registry`, in
              `--p-on-primary` on the ink band. A failed fetch leaves no
              catalogs, and then the line does not render. */}
          {catalogs.length > 0 && (
            <RegistryCounts
              catalogs={inView}
              geoActive={inView.length < catalogs.length}
              index={view?.index ?? null}
              all={catalogs}
              onInk
              className="mt-3"
            />
          )}
        </div>
      </div>
    </section>
  );
}
