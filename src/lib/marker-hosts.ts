/** Remove MapLibre wrapper semantics from markers that contain real buttons. */
export function neutralizeMarkerHosts(mapContainer: ParentNode) {
  mapContainer.querySelectorAll<HTMLElement>(".maplibregl-marker").forEach((marker) => {
    // Firefox reports unchanged attribute writes as new mutations.
    if (marker.hasAttribute("aria-label")) marker.removeAttribute("aria-label");
    if (marker.getAttribute("role") !== "presentation") {
      marker.setAttribute("role", "presentation");
    }
    if (marker.hasAttribute("tabindex")) marker.removeAttribute("tabindex");
  });
}
