// Mirror the portolan-cli example READMEs into tutorial MDX files.
//
// Usage: pnpm sync:cli-tutorials
//
// For each mirror in src/lib/cli-tutorials.ts, the script finds the last
// portolan-cli commit that changed the example directory, reads the README at
// that commit, and writes src/content/tutorials/<slug>.mdx. The pinned commit
// changes only when the example changes, so an unrelated CLI commit leaves the
// file as it is.
//
// CLI_REF picks the portolan-cli branch (default main). GH_TOKEN or
// GITHUB_TOKEN, when set, raises the GitHub API rate limit.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CLI_REPO,
  CLI_TUTORIALS,
  mirrorFile,
  renderMirror,
} from "../src/lib/cli-tutorials";

const ref = process.env.CLI_REF || "main";
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

async function get(url: string, accept: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: accept,
    "User-Agent": "portolan-sdi.org tutorial sync",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response;
}

/** The last commit on `ref` that changed `dir`. */
async function lastCommit(dir: string): Promise<string> {
  const query = new URLSearchParams({ sha: ref, path: dir, per_page: "1" });
  const response = await get(
    `https://api.github.com/repos/${CLI_REPO}/commits?${query}`,
    "application/vnd.github+json",
  );
  const commits = (await response.json()) as { sha: string }[];
  if (!commits.length) {
    throw new Error(`No ${CLI_REPO} commit on ${ref} touches ${dir}`);
  }
  return commits[0].sha;
}

async function readCurrent(file: string): Promise<string | null> {
  try {
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}

for (const mirror of CLI_TUTORIALS) {
  const sha = await lastCommit(mirror.dir);
  const readme = await (
    await get(
      `https://raw.githubusercontent.com/${CLI_REPO}/${sha}/${mirror.dir}/README.md`,
      "text/plain",
    )
  ).text();

  const file = path.join(process.cwd(), mirrorFile(mirror));
  const next = renderMirror(readme, mirror, sha);
  if ((await readCurrent(file)) === next) {
    console.log(`${mirror.slug}: unchanged at ${CLI_REPO}@${sha.slice(0, 7)}`);
    continue;
  }
  await writeFile(file, next);
  console.log(`${mirror.slug}: updated to ${CLI_REPO}@${sha.slice(0, 7)}`);
}
