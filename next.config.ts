import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// No remark or rehype plugins. Turbopack compiles MDX in Rust and cannot
// receive a JavaScript plugin function, and the blog needs none.
const withMDX = createMDX({});

const nextConfig: NextConfig = {
  // Post bodies live in src/content/blog and are imported, not routed. The
  // extension is listed anyway so a future .mdx page under src/app resolves.
  pageExtensions: ["ts", "tsx", "mdx"],

  // The /quickstart route was folded into the homepage; these run before the
  // next-intl proxy so all three locales land on the right anchor.
  async redirects() {
    return [
      // The quickstart page took the place of "How it works" and of the
      // ecosystem page.
      {
        source: "/how-it-works",
        destination: "/quickstart",
        permanent: false,
      },
      {
        source: "/:locale(es|ar)/how-it-works",
        destination: "/:locale/quickstart",
        permanent: false,
      },
      {
        source: "/ecosystem",
        destination: "/quickstart",
        permanent: false,
      },
      {
        source: "/:locale(es|ar)/ecosystem",
        destination: "/:locale/quickstart",
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(withMDX(nextConfig));
