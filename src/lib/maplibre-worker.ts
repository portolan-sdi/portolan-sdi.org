import { setWorkerUrl } from "maplibre-gl";

/**
 * Point MapLibre at its worker before any map mounts.
 *
 * MapLibre 6 ships its worker as a separate file. By default it looks for
 * that file next to its own module, through import.meta.url. After the
 * bundler moves MapLibre into a chunk, that path gives a 404 and no tile
 * renders. The URL below makes the bundler emit the worker as an asset and
 * return its real path.
 */
setWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href
);
