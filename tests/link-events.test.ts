import assert from "node:assert/strict";
import test from "node:test";
import { CTA_EVENT, MAX_TARGET, OUTBOUND_EVENT, linkEvent } from "../src/lib/link-events";

const origin = "https://www.portolan-sdi.org";

test("a link to another host is an outbound event", () => {
  assert.deepEqual(
    linkEvent("https://github.com/portolan-sdi/portolan-cli", origin),
    { name: OUTBOUND_EVENT, target: "github.com/portolan-sdi/portolan-cli" },
  );
});

test("the target drops the query, the fragment, and a trailing slash", () => {
  assert.deepEqual(
    linkEvent("https://cli.portolan-sdi.org/?ref=site#install", origin),
    { name: OUTBOUND_EVENT, target: "cli.portolan-sdi.org" },
  );
});

test("a fragment that holds a client-side route stays in the target", () => {
  assert.deepEqual(
    linkEvent(
      "https://browser.portolan-sdi.org/#/external/data.source.coop/x/catalog.json",
      origin,
    ),
    {
      name: OUTBOUND_EVENT,
      target:
        "browser.portolan-sdi.org/#/external/data.source.coop/x/catalog.json",
    },
  );
});

test("a subdomain of the site is another host", () => {
  assert.equal(
    linkEvent("https://cli.portolan-sdi.org/guide/", origin)?.name,
    OUTBOUND_EVENT,
  );
});

test("a link on the same origin sends no event", () => {
  assert.equal(linkEvent("/registry", origin), null);
  assert.equal(linkEvent("#how", origin), null);
  assert.equal(linkEvent(`${origin}/es/blog`, origin), null);
});

test("a link that opens another application sends no event", () => {
  assert.equal(linkEvent("mailto:team@example.org", origin), null);
  assert.equal(linkEvent("tel:+10000000000", origin), null);
});

test("a data-track value makes a cta event on any link", () => {
  assert.deepEqual(linkEvent("#how", origin, "hero-how"), {
    name: CTA_EVENT,
    target: "hero-how",
  });
});

test("the target is cut to the Vercel limit of 255 characters", () => {
  const long = `https://example.org/${"a".repeat(400)}`;
  assert.equal(linkEvent(long, origin)?.target.length, MAX_TARGET);
});
