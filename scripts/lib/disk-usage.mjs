/**
 * Directory sizes for the housekeeping CLIs. Kept here rather than inline so
 * `clean` and `doctor` report the same number for the same directory.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Bytes under `path`, or `null` when it does not exist. Unreadable entries are
 * skipped rather than thrown: a report is not worth failing over a locked file,
 * and on Windows a running dev server holds files open inside `.next`.
 */
export function directorySize(path) {
  let stats;
  try {
    stats = statSync(path);
  } catch {
    return null;
  }
  if (!stats.isDirectory()) return stats.size;

  let total = 0;
  const pending = [path];
  while (pending.length) {
    const current = pending.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const child = join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(child);
      } else if (entry.isFile()) {
        try {
          total += statSync(child).size;
        } catch {
          // Vanished or locked mid-walk; it is not part of the total.
        }
      }
    }
  }
  return total;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}
