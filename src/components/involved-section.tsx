import { useTranslations } from "next-intl";
import { Ltr } from "./ui";

// Credibility strip below "Who it's for": a mix of users and supporters, so
// there is no "Supported by" label. The logos stand alone, each linking to its
// canonical site. Some of these organizations build on Portolan and some
// publish with it, and the strip does not say which is which.
// Logos render as flat monochrome grey via CSS mask-image (see .logo-mono), so
// any source (color SVG, or a PNG's alpha) recolors uniformly; reaching the
// strip turns the row accent blue. `aspect` = intrinsic width/height; `h` is the px height.
// An org with no usable mark falls back to `text: true`, a grey text link.
//
// The strip holds still until a pointer or the keyboard reaches it (see
// .logo-marquee), then scrolls as a seamless marquee: the list is rendered
// twice so the pair loops without a seam. Reaching it also lights the row in
// the accent blue. Reduced-motion drops the clone and wraps the row flat.
type Org =
  | { name: string; href: string; text: true }
  | { name: string; href: string; file: string; h: number; aspect: number };

const orgs: readonly Org[] = [
  { name: "CARTO", href: "https://carto.com/", file: "carto.png", h: 22, aspect: 2.554 },
  { name: "Planet", href: "https://www.planet.com/", file: "planet.svg", h: 26, aspect: 2.047 },
  { name: "Radiant Earth", href: "https://radiant.earth/", file: "radiant-earth.svg", h: 16, aspect: 7.24 },
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
        <span className="logo-word text-lead font-bold tracking-[-0.02em] text-p-ink-3 transition-colors">
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
      className="logo-strip overflow-hidden border-t border-p-line py-[clamp(2rem,4vw,3.5rem)]"
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
