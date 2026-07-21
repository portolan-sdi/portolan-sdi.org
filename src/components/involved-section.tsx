import { Ltr } from "./ui";

// Credibility strip under the hero: a mix of users and supporters, so there is
// no "Supported by" label — just the logos, each linking to its canonical site.
// Logos render as flat monochrome grey via CSS mask-image (see .logo-mono), so
// any source (color SVG, or a PNG's alpha) recolors uniformly; on hover they
// darken to full ink. `aspect` = intrinsic width/height; `h` is the px height.
// Radiant Earth has no wordmark asset yet, so it renders as a grey text link.
const orgs = [
  { name: "CARTO", href: "https://carto.com/", file: "carto.png", h: 22, aspect: 2.554 },
  { name: "Planet", href: "https://www.planet.com/", file: "planet.svg", h: 26, aspect: 2.047 },
  { name: "Radiant Earth", href: "https://radiant.earth/", text: true },
  { name: "Source Cooperative", href: "https://source.coop/", file: "source-coop.svg", h: 19, aspect: 3.284 },
  { name: "PDOK", href: "https://www.pdok.nl/", file: "pdok.png", h: 26, aspect: 2.615 },
  { name: "Ayuntamiento de Madrid", href: "https://www.madrid.es/", file: "madrid.png", h: 26, aspect: 3.0 },
  { name: "Municipalidad de Pergamino", href: "https://pergamino.ar/", file: "pergamino.svg", h: 30, aspect: 2.734 },
  { name: "Ajuntament de Barcelona", href: "https://www.barcelona.cat/", file: "barcelona.svg", h: 22, aspect: 4.875 },
] as const;

export function InvolvedSection() {
  return (
    <section
      id="involved"
      aria-label="Users and supporters"
      className="px-[var(--p-pad-section-x)] py-[clamp(2rem,4vw,3.5rem)]"
    >
      <div className="max-w-[1240px] mx-auto flex flex-wrap items-center gap-x-[clamp(1.75rem,4vw,3.5rem)] gap-y-6">
        {orgs.map((org) => (
          <a
            key={org.name}
            href={org.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={org.name}
            className="logo-link inline-flex items-center"
          >
            {"text" in org ? (
              <span className="text-body-lg font-bold tracking-[-0.02em] text-p-ink-3 transition-colors hover:text-p-ink">
                <Ltr>{org.name}</Ltr>
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="logo-mono"
                style={{
                  height: `${org.h}px`,
                  width: `${Math.round(org.h * org.aspect)}px`,
                  WebkitMaskImage: `url(/logos/${org.file})`,
                  maskImage: `url(/logos/${org.file})`,
                }}
              />
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
