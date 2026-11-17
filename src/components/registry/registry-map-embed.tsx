"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  buildIndex,
  fetchCoverage,
  type CoverageIndex,
} from "@/lib/collection-points";
import { explorerParamString } from "@/lib/explorer-url";
import type { MapState } from "./catalog-map";

/**
 * The registry map on its own, for a page that is not the registry.
 *
 * It is the same `CatalogMap` the registry page draws, with the same data
 * from the same client fetch. It leaves out the region search, the catalog
 * search, and the cards. A point has no card to select here, so a click on
 * one opens the registry at the view on screen, searched for that catalog.
 *
 * The embed takes no catalog list, so it has no catalog titles. A point is
 * labelled with its catalog id, which is the fallback `CatalogMap` already
 * uses for a catalog the listing does not name.
 *
 * Nothing loads until the frame nears the viewport. The map chunk, the
 * coverage fetch, and the basemap tiles are all too heavy to spend on a
 * reader who never scrolls this far.
 */

/** Start loading this far ahead of the frame. */
const LOAD_MARGIN = "600px";

/** No catalog titles reach the embed. See the note above. */
const NO_TITLES = new Map<string, string>();

/**
 * The frame's height and rule, shared by the map and its placeholder so the
 * page does not shift when one replaces the other. The frame has a top rule
 * only. It runs edge to edge, and the block under it draws the next rule.
 */
const FRAME = "h-[380px] sm:h-[440px] md:h-[540px] border-t border-p-line";

/**
 * The frame while the map is absent. The text holds full contrast and does
 * not pulse, so a contrast check reads the same value on every run.
 */
function Placeholder({ failed = false }: { failed?: boolean }) {
  const t = useTranslations();
  return (
    <div className={`flex items-center justify-center bg-p-bg-soft ${FRAME}`}>
      <span className="font-mono text-small text-p-ink-2">
        {failed ? t("coverage.mapUnavailable") : t("registry.map.loading")}
      </span>
    </div>
  );
}

// The chunk is requested on the first render of `CatalogMap`, which happens
// only once the frame is near and the index has arrived.
const CatalogMap = dynamic(() => import("./catalog-map"), {
  ssr: false,
  loading: () => <Placeholder />,
});

export function RegistryMapEmbed() {
  const t = useTranslations("coverage.gestures");
  const router = useRouter();

  const hostRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<MapState | null>(null);

  const [near, setNear] = useState(false);
  const [index, setIndex] = useState<CoverageIndex | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || near) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: LOAD_MARGIN }
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [near]);

  useEffect(() => {
    if (!near) return;
    const controller = new AbortController();
    fetchCoverage(controller.signal)
      .then((data) => setIndex(buildIndex(data)))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Failed to load collection extents:", err);
        setFailed(true);
      });
    return () => controller.abort();
  }, [near]);

  const gestureHelp = useMemo(
    () => ({
      windows: t("windows"),
      mac: t("mac"),
      mobile: t("mobile"),
    }),
    [t]
  );

  const handleMove = useCallback((state: MapState) => {
    stateRef.current = state;
  }, []);

  // A click on a point. Empty ground reports null, which means nothing here.
  const handleSelect = useCallback(
    (id: string | null) => {
      if (!id) return;
      const state = stateRef.current;
      const query = explorerParamString({
        view: state
          ? {
              zoom: state.zoom,
              latitude: state.latitude,
              longitude: state.longitude,
            }
          : null,
        query: id,
        page: 0,
      });
      router.push(`/registry?${query}`);
    },
    [router]
  );

  return (
    <div ref={hostRef}>
      {index ? (
        <CatalogMap
          index={index}
          titles={NO_TITLES}
          selectedId={null}
          onSelect={handleSelect}
          onMove={handleMove}
          initialView={null}
          frameClassName={FRAME}
          geocoder={false}
          gestureHelp={gestureHelp}
        />
      ) : (
        <Placeholder failed={failed} />
      )}
    </div>
  );
}
