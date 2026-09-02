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
      {
        source: "/quickstart",
        destination: "/#quickstart",
        permanent: true,
      },
      {
        source: "/:locale(es|ar)/quickstart",
        destination: "/:locale#quickstart",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(withMDX(nextConfig));
