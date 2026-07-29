import { useTranslations } from "next-intl";
import { Ltr } from "./ui";

// Credibility strip under the hero: a mix of users and supporters, so there is
// no "Supported by" label — just the logos, each linking to its canonical site.
// Logos render as flat monochrome grey via CSS mask-image (see .logo-mono), so
// any source (color SVG, or a PNG's alpha) recolors uniformly; on hover they
// darken to full ink. `aspect` = intrinsic width/height; `h` is the px height.
// Radiant Earth has no wordmark asset yet, so it renders as a grey text link.
//
// The strip auto-scrolls as a seamless marquee (see .logo-marquee): the list is
// rendered twice so the pair loops without a seam. Hover or focus pauses it;
// reduced-motion drops the clone and wraps the row flat.
type Org =
  | { name: string; href: string; text: true }
  | { name: string; href: string; file: string; h: number; aspect: number };

const orgs: readonly Org[] = [
  { name: "CARTO", href: "https://carto.com/", file: "carto.png", h: 22, aspect: 2.554 },
  { name: "Planet", href: "https://www.planet.com/", file: "planet.svg", h: 26, aspect: 2.047 },
  { name: "Radiant Earth", href: "https://radiant.earth/", text: true },
  { name: "Taylor Geospatial Engine", href: "https://taylorgeospatial.org/", file: "taylor-geospatial.png", h: 22, aspect: 4.018 },
  { name: "Source Cooperative", href: "https://source.coop/", file: "source-coop.svg", h: 19, aspect: 3.284 },
  { name: "PDOK", href: "https://www.pdok.nl/", file: "pdok.png", h: 26, aspect: 2.615 },
  { name: "Ayuntamiento de Madrid", href: "https://www.madrid.es/", file: "madrid.png", h: 26, aspect: 3.0 },
  { name: "Municipalidad de Pergamino", href: "https://pergamino.ar/", file: "pergamino.svg", h: 30, aspect: 2.734 },
  { name: "Ajuntament de Barcelona", href: "https://www.barcelona.cat/", file: "barcelona.svg", h: 22, aspect: 4.875 },
  { name: "walkthru.earth", href: "https://walkthru.earth/", file: "logo-wte.svg", h: 30, aspect: 4.5 },
];

// One logo link. Clones (the second track) are decorative: hidden from the
// accessibility tree and removed from the tab order so each org is announced
// and focusable exactly once.
function LogoLink({ org, clone }: { org: Org; clone: boolean }) {
  return (
    <a
      href={org.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={clone ? undefined : org.name}
      aria-hidden={clone || undefined}
      tabIndex={clone ? -1 : undefined}
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
  );
}

export function InvolvedSection() {
  const t = useTranslations("involved");

  return (
    <section
      aria-label={t("ariaLabel")}
      className="logo-strip overflow-hidden py-[clamp(2rem,4vw,3.5rem)]"
    >
      <div className="logo-marquee">
        {[false, true].map((clone) => (
          <div
            key={clone ? "clone" : "orig"}
            className="logo-track"
            data-clone={clone ? "" : undefined}
          >
            {orgs.map((org) => (
              <LogoLink key={org.name} org={org} clone={clone} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
