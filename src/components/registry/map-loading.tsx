import { PortolanLogo } from "@/components/portolan-logo";

/**
 * The mark that a map frame shows while the map loads. It is the Portolan
 * logo, which turns, above the label.
 *
 * The map loads in stages. The chunk loads first, then the coverage data,
 * then the basemap style and its first tiles. The tiles come from a CDN and
 * are often the longest stage, so the map keeps this mark over its canvas
 * until MapLibre reports the first full render.
 *
 * The logo is the one spinner on the site. It does not turn under
 * `prefers-reduced-motion`. The label holds full contrast and does not
 * pulse, so a contrast check reads the same value on every run.
 */
export function MapLoading({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3">
      <PortolanLogo
        size={32}
        withWordmark={false}
        className="motion-safe:animate-[spin_1.6s_linear_infinite]"
      />
      <span className="text-small text-p-ink-2">{label}</span>
    </div>
  );
}
