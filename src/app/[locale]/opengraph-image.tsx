import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { routing } from "@/i18n/routing";
import { getDirection } from "@/i18n/direction";

export const alt = "Portolan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Design tokens, inlined. Satori resolves no CSS variables, so these mirror
// globals.css by hand and must be updated alongside it.
const PAPER = "#fcfcfa";
const INK = "#16170f";
const INK_3 = "#74766a";
const PRIMARY = "#4163cc";

const font = (file: string) =>
  readFile(join(process.cwd(), "assets/fonts", file));

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const rtl = getDirection(locale) === "rtl";

  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const { title } = messages.hero;

  // Satori does not implement the Unicode bidi algorithm: it lays glyph runs
  // out in logical order, which renders Arabic word sequences reversed. Rather
  // than ship broken typography, RTL locales get a wordmark-led card. The
  // brand mark and domain are identical across every locale either way.
  // Revisit if the headline is ever pre-shaped or rendered via a real browser.
  const [hanken, mono] = await Promise.all([
    font("hanken-800.ttf"),
    font("jetbrains-400.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: "64px 72px",
          border: `3px solid ${INK}`,
          fontFamily: "Hanken",
        }}
      >
        {/* The two-pennant mark, solid primary, never mirrored. */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="52" height="52" viewBox="0 0 32 32">
            <g fill={PRIMARY}>
              <path d="M2.83 18.247l26.34-9.124L2.83 0z" />
              <path d="M29.17 32V13.753L2.83 22.877z" />
            </g>
          </svg>
          {!rtl && (
            <div style={{ fontSize: 44, letterSpacing: "-0.015em" }}>
              Portolan
            </div>
          )}
        </div>

        {rtl ? (
          <div
            style={{
              display: "flex",
              fontSize: 132,
              letterSpacing: "-0.035em",
              lineHeight: 1.04,
            }}
          >
            Portolan
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              fontSize: 84,
              lineHeight: 1.04,
              letterSpacing: "-0.035em",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            direction: "ltr",
          }}
        >
          <div style={{ width: 56, height: 3, background: PRIMARY }} />
          <div
            style={{
              fontFamily: "JetBrains",
              fontSize: 25,
              color: INK_3,
              letterSpacing: "0.02em",
            }}
          >
            portolan-sdi.org
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Hanken", data: hanken, style: "normal", weight: 800 },
        { name: "JetBrains", data: mono, style: "normal", weight: 400 },
      ],
    },
  );
}
