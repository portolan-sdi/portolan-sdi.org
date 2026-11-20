/*
 * bake-hero-world.mts: bake the world that the homepage hero figure draws.
 *
 * Run it by hand, after bake-land-mask.mjs:
 *   pnpm bake:hero-world
 *
 * The script reads public/data/land-mask.json and writes
 * public/data/hero-world.json. That file holds the land points of the globe,
 * the outlines of the GeoParquet map, and the raster levels of the COG
 * drawing. The browser reads it and derives nothing from the land mask.
 * tests/hero-world.test.ts fails when the file and this bake differ.
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import {
  bakeWorld,
  decodeLand,
  type LandMaskFile,
} from "../src/components/home/hero-bake";

const HERE = dirname(fileURLToPath(import.meta.url));
const MASK_PATH = resolve(HERE, "../public/data/land-mask.json");
const OUT_PATH = resolve(HERE, "../public/data/hero-world.json");

const mask = JSON.parse(await readFile(MASK_PATH, "utf8")) as LandMaskFile;
const world = bakeWorld(decodeLand(mask));
const json = JSON.stringify(world);
await writeFile(OUT_PATH, json + "\n", "utf8");

const points = world.land.reduce((sum, run, i) => sum + (i % 2 ? run : 0), 0);
const vertices = world.rings.reduce((sum, ring) => sum + ring.length / 2, 0);
console.log(
  `Wrote ${OUT_PATH}` +
    `\n  land points ${points} of ${world.lattice}` +
    `\n  rings       ${world.rings.length}, ${vertices} vertices` +
    `\n  raster      ${world.levels.map((l) => `${l.nx}x${l.ny}`).join(", ")}` +
    `\n  size        ${(json.length / 1024).toFixed(0)} KB` +
    `\n  gzipped     ${(gzipSync(json).length / 1024).toFixed(0)} KB`,
);
