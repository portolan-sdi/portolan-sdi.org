import { Montserrat, Open_Sans } from "next/font/google";

// The two faces of the sample portal that ends the solution figure. They
// are the faces of the City of Philadelphia digital standards, and they
// draw only on that figure's canvas, so they are not part of the site
// type. Both are under the SIL Open Font License 1.1.
//
// Neither face is preloaded. The figure is below the fold, and its canvas
// asks for the faces itself before its first frame.
export const portalHead = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--pipe-font-head",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

export const portalBody = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--pipe-font-body",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
