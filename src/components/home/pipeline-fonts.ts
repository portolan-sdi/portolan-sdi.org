import localFont from "next/font/local";

// The two faces of Rowhouse Atlas, the fictional publisher whose portal ends
// the solution figure. They draw only on that figure's canvas, so they are
// not part of the site type. Both are under the SIL Open Font License 1.1,
// and the licence texts are next to the files in `./fonts/`. The files are
// subset to Latin-1. The italic is one static instance, because it sets one
// word.
//
// Neither face is preloaded. The figure is below the fold, and its canvas
// asks for the faces itself before its first frame.
export const portalSerif = localFont({
  src: [
    { path: "./fonts/Fraunces.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/FrauncesItalic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--pipe-font-serif",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

export const portalSans = localFont({
  src: "./fonts/InstrumentSans.woff2",
  weight: "400 700",
  variable: "--pipe-font-sans",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
