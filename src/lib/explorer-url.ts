/**
 * The registry explorer's state, as a URL carries it.
 *
 * A geographic search is worth sharing, so the map extent, the text query, and
 * the page all live in the query string. The server reads them to render the
 * first page of results, and the client writes them back as the map moves.
 */

export interface ExplorerView {
  zoom: number;
  latitude: number;
  longitude: number;
}

export interface ExplorerState {
  /** Where the map opens. Null opens the whole world. */
  view: ExplorerView | null;
  query: string;
  /** Zero-based, although the URL counts from one. */
  page: number;
}

export const EMPTY_EXPLORER_STATE: ExplorerState = {
  view: null,
  query: "",
  page: 0,
};

type ParamInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function read(input: ParamInput, key: string): string | null {
  if (input instanceof URLSearchParams) return input.get(key);
  const value = input[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function parseExplorerParams(input: ParamInput): ExplorerState {
  const map = read(input, "m");
  const parts = map ? map.split("/").map(Number) : [];
  const view =
    parts.length === 3 && parts.every((part) => Number.isFinite(part))
      ? { zoom: parts[0], latitude: parts[1], longitude: parts[2] }
      : null;

  const page = Number(read(input, "p"));

  return {
    view,
    query: read(input, "q") ?? "",
    page: Number.isFinite(page) && page > 1 ? Math.floor(page) - 1 : 0,
  };
}

/** The query string for a state, without the leading question mark. */
export function explorerParamString(state: ExplorerState): string {
  const params = new URLSearchParams();
  if (state.view) {
    const { zoom, latitude, longitude } = state.view;
    params.set("m", `${zoom.toFixed(2)}/${latitude.toFixed(4)}/${longitude.toFixed(4)}`);
  }
  if (state.query) params.set("q", state.query);
  if (state.page > 0) params.set("p", String(state.page + 1));
  return params.toString();
}
