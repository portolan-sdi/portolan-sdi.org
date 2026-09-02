/**
 * The questions the FAQ renders, in order, with the paragraph count of each
 * answer. `faq-page.tsx` renders from this list and the route builds its
 * FAQPage structured data from the same list, so the two cannot drift.
 */
export const FAQ_ITEMS = [
  { key: "standards", paras: 3 },
  { key: "servers", paras: 2 },
  { key: "capabilities", paras: 5 },
  { key: "conformance", paras: 2 },
  { key: "lockIn", paras: 2 },
  { key: "dataModel", paras: 2 },
  { key: "agents", paras: 3 },
  { key: "gaps", paras: 2 },
  { key: "name", paras: 3 },
] as const;
