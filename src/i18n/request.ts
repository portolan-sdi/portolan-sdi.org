import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // Latin (Western) digits in every locale, including Arabic, so versions,
    // stats, and dates stay copy-paste friendly and never shape to ٠١٢٣.
    formats: {
      number: { decimal: { numberingSystem: "latn" } },
      dateTime: {
        short: { numberingSystem: "latn" },
        // Blog post dates. Latin digits for the same reason as `short`.
        postDate: {
          year: "numeric",
          month: "long",
          day: "numeric",
          numberingSystem: "latn",
        },
      },
    },
  };
});
