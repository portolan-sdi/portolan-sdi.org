"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Map as MapGL,
  Source,
  Layer,
  Popup,
  type MapRef,
  type MapLayerMouseEvent,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  ExpressionSpecification,
} from "maplibre-gl";
import type { Catalog } from "@/lib/catalogs";
import { getCoverageTier } from "@/lib/catalogs";
import { MapGeocoder } from "./map-geocoder";
import { CatalogCardBody } from "./catalog-card";
import type { GeocodeSuggestion } from "@/hooks/use-geocode";

const CARTO_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const INITIAL_VIEW = { longitude: 0, latitude: 20, zoom: 1.3 };

const FIT_PADDING = 60;
const FIT_MAX_ZOOM = 6;

// Deck/maplibre render the world at 512px per tile; we solve for the zoom at
// which a bbox's larger dimension first reaches RECT_PX_THRESHOLD on screen,
// then store that as a per-feature `rectZoom` and switch dot -> rectangle by
// comparing it to the live zoom in the layer filters.
const TILE_SIZE = 512;
const RECT_PX_THRESHOLD = 30;
const DEGENERATE_EPS = 1e-4;
const NEVER_RECT_ZOOM = 99; // antimeridian / degenerate bboxes stay dots

type Bounds = [[number, number], [number, number]];

function normalizeLon(lon: number): number {
  return ((lon + 540) % 360) - 180;
}

function rectZoomFor(maxDeg: number): number {
  // px = deg/360 * TILE_SIZE * 2^zoom = THRESHOLD  ->  solve for zoom.
  return Math.log2((RECT_PX_THRESHOLD * 360) / (TILE_SIZE * maxDeg));
}

function readThemeHex(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return /^#[0-9a-f]{3,8}$/i.test(raw) ? raw : fallback;
}

interface CatalogMapProps {
  catalogs: Catalog[];
}

export default function CatalogMap({ catalogs }: CatalogMapProps) {
  const t = useTranslations("registry");

  const mapRef = useRef<MapRef | null>(null);
  const didFit = useRef(false);

  const [zoom, setZoom] = useState(INITIAL_VIEW.zoom);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hover, setHover] = useState<{ lng: number; lat: number; title: string } | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const { points, polys, bounds, byId, globalCatalogs, unlocated } = useMemo(() => {
    const pointFeatures: GeoJSON.Feature<GeoJSON.Point>[] = [];
    const polyFeatures: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
    const byId = new Map<string, Catalog>();
    const globalCatalogs: Catalog[] = [];
    const unlocated: Catalog[] = [];
    let w = 180;
    let s = 90;
    let e = -180;
    let n = -90;

    for (const catalog of catalogs) {
      if (!catalog.bbox) {
        unlocated.push(catalog);
        continue;
      }
      const [west, south, east, north] = catalog.bbox;
      // Guard against malformed bboxes: non-finite values, inverted axes, or
      // coordinates outside the world. MapLibre's fitBounds throws on any lat
      // outside [-90, 90] (or lon outside [-180, 180]), so a single bad entry
      // would otherwise poison the accumulated bounds and break the map fit.
      // West > east is allowed — that's an antimeridian crossing, handled below.
      const validBbox =
        [west, south, east, north].every(Number.isFinite) &&
        south >= -90 &&
        north <= 90 &&
        south <= north &&
        west >= -180 &&
        west <= 180 &&
        east >= -180 &&
        east <= 180;
      if (!validBbox) {
        unlocated.push(catalog);
        continue;
      }
      byId.set(catalog.id, catalog);

      // A catalog claiming most of the globe covers every located one beneath
      // it and drags the initial fit out to the whole world. It leaves the map
      // and is listed underneath instead, where it stays selectable.
      if (getCoverageTier(catalog.bbox) === "global") {
        globalCatalogs.push(catalog);
        continue;
      }

      const crossesAntimeridian = west > east;
      const widthDeg = crossesAntimeridian ? east + 360 - west : east - west;
      const heightDeg = north - south;
      const degenerate = widthDeg <= DEGENERATE_EPS || heightDeg <= DEGENERATE_EPS;
      const eligibleRect = !crossesAntimeridian && !degenerate;
      const rawMidLon = crossesAntimeridian ? west + widthDeg / 2 : (west + east) / 2;
      const centroid: [number, number] = [normalizeLon(rawMidLon), (south + north) / 2];
      const rectZoom = eligibleRect
        ? rectZoomFor(Math.max(widthDeg, heightDeg))
        : NEVER_RECT_ZOOM;
      // Continent-scale boxes keep their outline but drop the fill, so a
      // country-scale catalog inside one stays readable through it.
      const tier = getCoverageTier(catalog.bbox) ?? "local";

      pointFeatures.push({
        type: "Feature",
        properties: { catalogId: catalog.id, rectZoom, tier },
        geometry: { type: "Point", coordinates: centroid },
      });

      if (eligibleRect) {
        polyFeatures.push({
          type: "Feature",
          properties: { catalogId: catalog.id, rectZoom, tier },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [west, south],
                [east, south],
                [east, north],
                [west, north],
                [west, south],
              ],
            ],
          },
        });
        w = Math.min(w, west);
        e = Math.max(e, east);
      } else {
        w = Math.min(w, centroid[0]);
        e = Math.max(e, centroid[0]);
      }
      s = Math.min(s, south);
      n = Math.max(n, north);
    }

    const points: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features: pointFeatures,
    };
    const polys: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
      type: "FeatureCollection",
      features: polyFeatures,
    };
    const bounds: Bounds | null =
      pointFeatures.length > 0 ? [[w, s], [e, n]] : null;

    return { points, polys, bounds, byId, globalCatalogs, unlocated };
  }, [catalogs]);

  // Selection resolves through the current catalog set, so a filtered-out
  // selection simply becomes null.
  const selected = selectedId ? byId.get(selectedId) ?? null : null;

  const colors = useMemo(
    () => ({
      primary: readThemeHex("--p-primary", "#4163cc"),
      accent: readThemeHex("--p-accent", "#4163cc"),
      stroke: "#ffffff",
    }),
    [],
  );

  const selectedExpr: ExpressionSpecification = [
    "==",
    ["get", "catalogId"],
    selectedId ?? "",
  ];

  const fitAll = useCallback(
    (duration: number) => {
      if (!bounds) return;
      mapRef.current?.fitBounds(bounds, {
        padding: FIT_PADDING,
        maxZoom: FIT_MAX_ZOOM,
        duration,
      });
    },
    [bounds],
  );

  const handleLoad = useCallback(() => {
    if (didFit.current) return;
    fitAll(0);
    const z = mapRef.current?.getZoom();
    if (typeof z === "number") setZoom(z);
    didFit.current = true;
  }, [fitAll]);

  const handleGeocode = useCallback((sug: GeocodeSuggestion) => {
    const map = mapRef.current;
    if (!map) return;
    if (sug.bbox) {
      const [west, south, east, north] = sug.bbox;
      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        { padding: FIT_PADDING, maxZoom: 12, duration: 800 },
      );
    } else {
      map.flyTo({ center: [sug.lng, sug.lat], zoom: 10, duration: 800 });
    }
  }, []);

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const id = e.features?.[0]?.properties?.catalogId as string | undefined;
    setSelectedId(id ?? null);
  }, []);

  const handleMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      const id = feature?.properties?.catalogId as string | undefined;
      if (id) {
        const cat = byId.get(id);
        setCursor("pointer");
        setHover(cat ? { lng: e.lngLat.lng, lat: e.lngLat.lat, title: cat.title } : null);
      } else {
        setCursor(undefined);
        setHover(null);
      }
    },
    [byId],
  );

  const handleMouseLeave = useCallback(() => {
    setCursor(undefined);
    setHover(null);
  }, []);

  const dotPaint: CircleLayerSpecification["paint"] = {
    "circle-radius": 6,
    "circle-color": ["case", selectedExpr, colors.accent, colors.primary],
    "circle-stroke-width": 1.5,
    "circle-stroke-color": colors.stroke,
    "circle-opacity": 0.95,
  };
  const fillPaint: FillLayerSpecification["paint"] = {
    "fill-color": colors.primary,
    "fill-opacity": [
      "case",
      ["==", ["get", "tier"], "large"],
      ["case", selectedExpr, 0.12, 0.05],
      selectedExpr,
      0.25,
      0.15,
    ],
  };
  const linePaint: LineLayerSpecification["paint"] = {
    "line-color": ["case", selectedExpr, colors.accent, colors.primary],
    "line-width": ["case", selectedExpr, 3, 2],
  };

  const dashedLinePaint: LineLayerSpecification["paint"] = {
    "line-color": ["case", selectedExpr, colors.accent, colors.primary],
    "line-width": ["case", selectedExpr, 2.5, 1.5],
    "line-dasharray": [3, 2],
    "line-opacity": 0.8,
  };

  const dotFilter: ExpressionSpecification = [">", ["get", "rectZoom"], zoom];
  const rectFilter: ExpressionSpecification = ["<=", ["get", "rectZoom"], zoom];
  const localRectFilter: ExpressionSpecification = [
    "all",
    rectFilter,
    ["==", ["get", "tier"], "local"],
  ];
  const largeRectFilter: ExpressionSpecification = [
    "all",
    rectFilter,
    ["==", ["get", "tier"], "large"],
  ];


  return (
    <>
      <div
        dir="ltr"
        className="relative h-[520px] md:h-[600px] border border-p-line overflow-hidden"
        role="application"
        aria-label={t("map.searchLabel")}
      >
        <MapGL
          ref={mapRef}
          initialViewState={INITIAL_VIEW}
          mapStyle={CARTO_STYLE}
          attributionControl={false}
          dragRotate={false}
          touchPitch={false}
          interactiveLayerIds={["catalog-dots", "catalog-bbox-fill"]}
          cursor={cursor}
          onLoad={handleLoad}
          onZoom={(e: ViewStateChangeEvent) => setZoom(e.viewState.zoom)}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ width: "100%", height: "100%" }}
        >
          <Source id="catalog-polys" type="geojson" data={polys}>
            {/* One fill across both tiers so a continent-scale box stays a
                click target, at an opacity that keeps it from washing out the
                smaller catalogs drawn inside it. */}
            <Layer id="catalog-bbox-fill" type="fill" filter={rectFilter} paint={fillPaint} />
            <Layer id="catalog-bbox-line" type="line" filter={localRectFilter} paint={linePaint} />
            <Layer
              id="catalog-bbox-large"
              type="line"
              filter={largeRectFilter}
              paint={dashedLinePaint}
            />
          </Source>
          <Source id="catalog-points" type="geojson" data={points}>
            <Layer id="catalog-dots" type="circle" filter={dotFilter} paint={dotPaint} />
          </Source>

          {hover && (
            <Popup
              longitude={hover.lng}
              latitude={hover.lat}
              closeButton={false}
              closeOnClick={false}
              offset={14}
              className="catalog-map-popup"
            >
              <span className="text-micro font-mono text-p-ink">{hover.title}</span>
            </Popup>
          )}
        </MapGL>

        {/* Geocoder (top-left) */}
        <div className="absolute top-3 start-3 z-10">
          <MapGeocoder onSelect={handleGeocode} />
        </div>

        {/* Zoom + reset stack (top-right) */}
        <div className="absolute top-3 end-3 z-10 flex flex-col overflow-hidden border border-p-line">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            aria-label={t("map.zoomIn")}
            className="flex items-center justify-center w-9 h-9 bg-p-paper text-p-ink-2 hover:text-p-ink hover:bg-p-bg-soft transition-colors border-b border-p-line"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            aria-label={t("map.zoomOut")}
            className="flex items-center justify-center w-9 h-9 bg-p-paper text-p-ink-2 hover:text-p-ink hover:bg-p-bg-soft transition-colors border-b border-p-line"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => fitAll(600)}
            aria-label={t("map.reset")}
            className="flex items-center justify-center w-9 h-9 bg-p-paper text-p-ink-2 hover:text-p-ink hover:bg-p-bg-soft transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="2" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
            </svg>
          </button>
        </div>

        {/* Detail panel (bottom-left) */}
        {selected && (
          <div className="absolute bottom-3 start-3 z-10 flex w-[340px] max-w-[calc(100%-1.5rem)] flex-col gap-3 bg-p-paper border border-p-line p-4 pe-9">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label={t("map.closeDetails")}
              className="absolute top-3 end-3 z-10 text-p-ink-3 hover:text-p-ink transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {/* Same component the grid renders, so the two views cannot drift. */}
            <CatalogCardBody catalog={selected} />
          </div>
        )}

        {/* Attribution (bottom-right). Solid, per the flat-surface rule. */}
        <div className="absolute bottom-3 end-3 z-10 bg-p-paper border border-p-line px-2.5 py-1">
          <span className="text-micro text-p-ink-3 font-mono">
            {"© "}
            <a
              href="https://carto.com/attributions"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-p-ink-2 underline underline-offset-2"
            >
              CARTO
            </a>
            {" · © "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-p-ink-2 underline underline-offset-2"
            >
              OSM
            </a>
            {" · "}
            <a
              href="https://nominatim.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-p-ink-2 underline underline-offset-2"
            >
              Nominatim
            </a>
          </span>
        </div>
      </div>

      {/* Legend and the catalogs the map cannot place. Always visible: it is
          shorter than the popover it replaced and does not need opening. */}
      <div className="mt-3 flex flex-col gap-3 text-micro font-mono text-p-ink-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" dir="ltr">
          <LegendKey label={t("map.legend.dot")}>
            <circle cx="7" cy="7" r="4.5" fill="var(--p-primary)" />
          </LegendKey>
          <LegendKey label={t("map.legend.area")}>
            <rect
              x="1.5"
              y="2.5"
              width="11"
              height="9"
              fill="var(--p-primary)"
              fillOpacity={0.2}
              stroke="var(--p-primary)"
              strokeWidth="1.5"
            />
          </LegendKey>
          <LegendKey label={t("map.legend.wide")}>
            <rect
              x="1.5"
              y="2.5"
              width="11"
              height="9"
              fill="none"
              stroke="var(--p-primary)"
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
          </LegendKey>
        </div>

        {(globalCatalogs.length > 0 || unlocated.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span className="text-p-ink-2">
              {globalCatalogs.length > 0
                ? t("map.worldwide")
                : t("map.noLocation", { count: String(unlocated.length) })}
            </span>
            {globalCatalogs.map((catalog) => (
              <button
                key={catalog.id}
                type="button"
                onClick={() =>
                  setSelectedId((current) => (current === catalog.id ? null : catalog.id))
                }
                aria-pressed={selectedId === catalog.id}
                className={`max-w-[22ch] truncate border px-2 py-0.5 transition-colors cursor-pointer ${
                  selectedId === catalog.id
                    ? "border-p-primary text-p-primary"
                    : "border-p-line-soft hover:border-p-ink-3 hover:text-p-ink"
                }`}
              >
                {catalog.title}
              </button>
            ))}
            {globalCatalogs.length > 0 && unlocated.length > 0 && (
              <span>· {t("map.noLocation", { count: String(unlocated.length) })}</span>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function LegendKey({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
        {children}
      </svg>
      {label}
    </span>
  );
}
