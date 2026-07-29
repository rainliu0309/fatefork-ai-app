import { createHash } from "node:crypto";

/**
 * Stable IDs allow duplicate local submissions to be recognized without
 * storing the sensitive source fields anywhere on the server.
 */
export function stableId(prefix: string, value: unknown): string {
  const digest = createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 16);
  return `${prefix}_${digest}`;
}
