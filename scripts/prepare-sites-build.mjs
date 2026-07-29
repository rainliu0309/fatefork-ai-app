import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const workerBuild = path.join(dist, "fatefork_sites_preview");
const server = path.join(dist, "server");
const metadata = path.join(dist, ".openai");

await rm(server, { recursive: true, force: true });
await mkdir(server, { recursive: true });
await mkdir(metadata, { recursive: true });
await copyFile(path.join(workerBuild, "index.js"), path.join(server, "index.js"));
await copyFile(
  path.join(workerBuild, "wrangler.json"),
  path.join(dist, "wrangler.json"),
);
await copyFile(
  path.join(root, ".openai", "hosting.json"),
  path.join(metadata, "hosting.json"),
);

console.log("Prepared the Cloudflare-compatible Sites artifact.");
