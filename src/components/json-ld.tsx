/**
 * Renders one JSON-LD block. Next.js has no metadata field for structured
 * data, so the script tag goes in the tree instead.
 *
 * `<` is escaped because the payload sits inside a script element, where a
 * literal `</script>` in any string would close the tag early.
 */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
