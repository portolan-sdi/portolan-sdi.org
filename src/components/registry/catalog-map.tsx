"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Supercluster from "supercluster";
import {
  Map as MapGL,
  Marker,
  Popup,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import type { CollectionPoint, CoverageIndex, Viewport } from "@/lib/collection-points";
import { MapGeocoder } from "./map-geocoder";
import type { GeocodeSuggestion } from "@/hooks/use-geocode";

/**
 * The registry's geographic entry point.
 *
 * The map draws one point per collection extent, clustered. A cluster labels
 * the number of catalogs it holds, not the number of collections, so a
 * publisher with fifty nearby collections cannot outweigh fifty publishers.
 *
 * The map decides nothing about the results. It reports its viewport, and the
 * page matches catalogs by bbox overlap. See src/lib/collection-points.ts.
 */

const CARTO_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export const WORLD_VIEW = { longitude: 0, latitude: 20, zoom: 1.3 };

const CLUSTER_RADIUS = 60;
const CLUSTER_MAX_ZOOM = 14;

/** What the page needs after every move: the filter box and the URL state. */
export interface MapState {
  viewport: Viewport;
  longitude: number;
  latitude: number;
  zoom: number;
}

interface ClusterProps {
  ids: Set<string>;
}

interface LeafProps extends ClusterProps {
  point: CollectionPoint;
}

/**
 * What the pointer rests on.
 *
 * A point leads with its catalog, because that is what a click selects, then
 * names the collections it holds when there are few enough to name. A point
 * never reports a collection total. The card below owns that number and counts
 * it differently, so two totals on one screen would contradict each other.
 *
 * A cluster answers only when it holds one catalog. Listing six catalog titles
 * under a pointer builds a wall of text nobody reads, and the square already
 * carries the number.
 */
interface Hover {
  lng: number;
  lat: number;
  heading: string;
  names: string[];
  foot: string | null;
}

type Rendered =
  | { kind: "cluster"; id: number; lng: number; lat: number; ids: string[]; selected: boolean }
  | { kind: "point"; point: CollectionPoint; selected: boolean; dimmed: boolean };

interface CatalogMapProps {
  index: CoverageIndex;
  /** Catalog id to title, for the point label. */
  titles: Map<string, string>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (state: MapState) => void;
  /** Where to open, restored from the URL. Null opens the whole world. */
  initialView: { longitude: number; latitude: number; zoom: number } | null;
}

function readState(map: MapRef): MapState {
  const bounds = map.getBounds();
  const center = map.getCenter();
  return {
    viewport: {
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
    },
    longitude: center.lng,
    latitude: center.lat,
    zoom: map.getZoom(),
  };
}

/** Cluster squares grow with the count, in four steps rather than smoothly. */
function clusterSize(count: number): number {
  if (count >= 8) return 34;
  if (count >= 4) return 30;
  if (count >= 2) return 26;
  return 22;
}

function clusterHover(
  item: Extract<Rendered, { kind: "cluster" }>,
  titles: Map<string, string>
): Hover | null {
  if (item.ids.length !== 1) return null;
  const id = item.ids[0];
  return {
    lng: item.lng,
    lat: item.lat,
    heading: titles.get(id) ?? id,
    names: [],
    foot: null,
  };
}

function pointHover(
  point: CollectionPoint,
  titles: Map<string, string>,
  placeLabel: (point: CollectionPoint) => string | null
): Hover {
  return {
    lng: point.lng,
    lat: point.lat,
    heading: titles.get(point.catalogId) ?? point.catalogId,
    names: point.titles,
    foot: placeLabel(point),
  };
}

export default function CatalogMap({
  index,
  titles,
  selectedId,
  onSelect,
  onMove,
  initialView,
}: CatalogMapProps) {
  const t = useTranslations("registry");

  const mapRef = useRef<MapRef | null>(null);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState(initialView?.zoom ?? WORLD_VIEW.zoom);
  const [infoOpen, setInfoOpen] = useState(false);
  const [hover, setHover] = useState<Hover | null>(null);

  // A catalog with one place needs no rank. One with seven does, or its seven
  // squares all read the same.
  const placeLabel = useCallback(
    (point: CollectionPoint) =>
      point.placeCount > 1
        ? t("map.place", {
            index: String(point.placeIndex),
            total: String(point.placeCount),
          })
        : null,
    [t]
  );
  const pointLabel = useCallback(
    (point: CollectionPoint) => {
      const catalog = titles.get(point.catalogId) ?? point.catalogId;
      const rank = placeLabel(point);
      return rank ? `${catalog} · ${rank}` : catalog;
    },
    [placeLabel, titles]
  );

  // A cluster carries the set of catalogs beneath it. Set union is idempotent,
  // so supercluster reusing an accumulator across zoom levels cannot inflate
  // the count the way a running total would.
  const cluster = useMemo(() => {
    const instance = new Supercluster<LeafProps, ClusterProps>({
      radius: CLUSTER_RADIUS,
      maxZoom: CLUSTER_MAX_ZOOM,
      map: (props) => ({ ids: new Set(props.ids) }),
      reduce: (accumulated, props) => {
        // Replace the set rather than add to it. Supercluster hands the
        // accumulator a shallow copy of the finer cluster's properties, so
        // mutating the set in place would write back into that cluster and
        // inflate its count.
        accumulated.ids = new Set([...accumulated.ids, ...props.ids]);
      },
    });
    instance.load(
      index.points.map((point) => ({
        type: "Feature" as const,
        properties: { point, ids: new Set([point.catalogId]) },
        geometry: { type: "Point" as const, coordinates: [point.lng, point.lat] },
      }))
    );
    return instance;
  }, [index]);

  const rendered = useMemo<Rendered[]>(() => {
    if (!bounds) return [];
    return cluster.getClusters(bounds, Math.round(zoom)).map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties as ClusterProps & Partial<LeafProps> & {
        cluster?: boolean;
        cluster_id?: number;
      };
      const holdsSelected = selectedId !== null && props.ids.has(selectedId);

      if (props.cluster) {
        return {
          kind: "cluster" as const,
          id: props.cluster_id as number,
          lng,
          lat,
          ids: [...props.ids],
          selected: holdsSelected,
        };
      }
      return {
        kind: "point" as const,
        point: props.point as CollectionPoint,
        selected: holdsSelected,
        dimmed: selectedId !== null && !holdsSelected,
      };
    });
  }, [cluster, bounds, zoom, selectedId]);

  const report = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const state = readState(map);
    setBounds([
      state.viewport.west,
      state.viewport.south,
      state.viewport.east,
      state.viewport.north,
    ]);
    setZoom(state.zoom);
    onMove(state);
  }, [onMove]);

  const handleGeocode = useCallback((suggestion: GeocodeSuggestion) => {
    const map = mapRef.current;
    if (!map) return;
    if (suggestion.bbox) {
      const [west, south, east, north] = suggestion.bbox;
      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        { padding: 60, maxZoom: 12, duration: 800 }
      );
      return;
    }
    map.flyTo({ center: [suggestion.lng, suggestion.lat], zoom: 10, duration: 800 });
  }, []);

  /**
   * Clicking empty ground drops the selection.
   *
   * A marker is an HTML overlay inside the map container, so a click on one
   * reaches MapLibre's own listener as well. That listener runs before React's,
   * which makes stopPropagation in the marker handler too late. The map reads
   * what was actually clicked instead.
   */
  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const target = event.originalEvent.target as HTMLElement | null;
      if (target?.closest(".maplibregl-marker")) return;
      onSelect(null);
    },
    [onSelect]
  );

  const expandCluster = useCallback(
    (id: number, lng: number, lat: number) => {
      const map = mapRef.current;
      if (!map) return;
      const next = Math.min(cluster.getClusterExpansionZoom(id), CLUSTER_MAX_ZOOM + 2);
      map.easeTo({ center: [lng, lat], zoom: next, duration: 500 });
    },
    [cluster]
  );

  return (
    <div
      dir="ltr"
      className="relative h-[440px] md:h-[540px] border border-p-line overflow-hidden"
      role="application"
      aria-label={t("map.label")}
    >
      <MapGL
        ref={mapRef}
        initialViewState={initialView ?? WORLD_VIEW}
        mapStyle={CARTO_STYLE}
        attributionControl={false}
        dragRotate={false}
        touchPitch={false}
        onLoad={report}
        onMoveEnd={report}
        onClick={handleMapClick}
        style={{ width: "100%", height: "100%" }}
      >
        {rendered.map((item) =>
          item.kind === "cluster" ? (
            <Marker
              key={`c-${item.id}`}
              longitude={item.lng}
              latitude={item.lat}
              onClick={() => expandCluster(item.id, item.lng, item.lat)}
            >
              <button
                type="button"
                aria-label={t("map.cluster", { count: String(item.ids.length) })}
                onMouseEnter={() => setHover(clusterHover(item, titles))}
                onFocus={() => setHover(clusterHover(item, titles))}
                onMouseLeave={() => setHover(null)}
                onBlur={() => setHover(null)}
                style={{
                  width: clusterSize(item.ids.length),
                  height: clusterSize(item.ids.length),
                }}
                className={`flex cursor-pointer items-center justify-center border font-mono text-eyebrow leading-none transition-colors ${
                  item.selected
                    ? "border-p-ink bg-p-ink text-p-bg"
                    : "border-p-primary bg-p-primary text-p-on-primary hover:border-p-ink hover:bg-p-ink"
                }`}
              >
                {item.ids.length}
              </button>
            </Marker>
          ) : (
            <Marker
              key={`p-${item.point.key}`}
              longitude={item.point.lng}
              latitude={item.point.lat}
              onClick={() => onSelect(item.point.catalogId)}
            >
              <button
                type="button"
                aria-label={pointLabel(item.point)}
                onMouseEnter={() => setHover(pointHover(item.point, titles, placeLabel))}
                onFocus={() => setHover(pointHover(item.point, titles, placeLabel))}
                onMouseLeave={() => setHover(null)}
                onBlur={() => setHover(null)}
                className={`block cursor-pointer border transition-colors ${
                  item.selected
                    ? "h-3.5 w-3.5 border-p-ink bg-p-ink"
                    : `h-2.5 w-2.5 border-p-primary bg-p-primary hover:border-p-ink hover:bg-p-ink ${
                        item.dimmed ? "opacity-30" : ""
                      }`
                }`}
              />
            </Marker>
          )
        )}
        {hover && (
          <Popup
            longitude={hover.lng}
            latitude={hover.lat}
            anchor="bottom"
            offset={14}
            closeButton={false}
            closeOnClick={false}
            className="registry-popup"
          >
            <div dir="auto" className="max-w-[240px] font-mono text-small leading-snug">
              <p className="text-p-ink">{hover.heading}</p>
              {hover.names.map((name) => (
                <p key={name} className="text-p-ink-2">
                  {name}
                </p>
              ))}
              {hover.foot && <p className="mt-1 text-p-ink-3">{hover.foot}</p>}
            </div>
          </Popup>
        )}
      </MapGL>

      {/* Region search (top-left) */}
      <div className="absolute top-3 start-3 z-10">
        <MapGeocoder onSelect={handleGeocode} />
      </div>

      {/* Zoom stack (top-right) */}
      <div className="absolute top-3 end-3 z-10 flex flex-col overflow-hidden border border-p-line">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          aria-label={t("map.zoomIn")}
          className="flex items-center justify-center w-9 h-9 bg-p-paper text-p-ink-2 hover:text-p-ink hover:bg-p-bg-soft transition-colors border-b border-p-line cursor-pointer"
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
          className="flex items-center justify-center w-9 h-9 bg-p-paper text-p-ink-2 hover:text-p-ink hover:bg-p-bg-soft transition-colors border-b border-p-line cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        {/* Back to the whole world, which is also how you clear the
            geographic filter on the results below. */}
        <button
          type="button"
          onClick={() =>
              // easeTo reads a center pair, not longitude and latitude keys.
              // Spreading the view here would move the zoom and leave the
              // map wherever it already sat.
              mapRef.current?.easeTo({
                center: [WORLD_VIEW.longitude, WORLD_VIEW.latitude],
                zoom: WORLD_VIEW.zoom,
                duration: 600,
              })
            }
          aria-label={t("map.reset")}
          className="flex items-center justify-center w-9 h-9 bg-p-paper text-p-ink-2 hover:text-p-ink hover:bg-p-bg-soft transition-colors cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18" />
            <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" />
          </svg>
        </button>
      </div>

      {/* Credits, closed by default. Attribution has to be reachable, and it
          does not have to sit across the bottom of the map to be. */}
      <div className="absolute bottom-3 end-3 z-10 flex items-end gap-2">
        {infoOpen && (
          <div className="w-[240px] max-w-[calc(100vw-2rem)] border border-p-line bg-p-paper p-3 text-small font-mono text-p-ink-2 leading-relaxed">
            {"© "}
            <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-p-ink">
              CARTO
            </a>
            {" · © "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-p-ink">
              OpenStreetMap
            </a>
            {" · "}
            <a href="https://nominatim.org/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-p-ink">
              Nominatim
            </a>
          </div>
        )}
        <button
          type="button"
          onClick={() => setInfoOpen((open) => !open)}
          aria-label={t("map.info")}
          aria-expanded={infoOpen}
          className="flex h-6 w-6 shrink-0 items-center justify-center border border-p-line bg-p-paper font-mono text-small text-p-ink-3 transition-colors hover:text-p-ink cursor-pointer"
        >
          i
        </button>
      </div>
    </div>
  );
}
