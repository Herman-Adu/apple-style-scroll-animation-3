/**
 * Pure architecture metrics over { path, text } records. Lower is better for
 * every metric, which lets `compare` act as a one-way ratchet in CI.
 */

const LARGE_FILE_LINES = 300;
const APP_ROUTE_ENTRY = /^app\/(?:.*\/)?(?:page|layout)\.tsx$/;
const ALLOWED_ROUTE_KEYS = new Set([
  "params",
  "searchParams",
  "children",
  "error",
  "reset",
]);

const count = (text, pattern) => text.match(pattern)?.length ?? 0;
const toPosixPath = (path) => path.replace(/\\/g, "/");

function resolveRelativePosix(fromPath, specifier) {
  const stack = fromPath.split("/");
  stack.pop();
  for (const part of specifier.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

function inversionCount({ path, text }) {
  const aliasInversions = count(text, /from\s+["']@\/features/g);
  const relativeSpecs = [
    ...text.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g),
  ].map((match) => match[1]);
  const relativeInversions = relativeSpecs.filter((spec) =>
    resolveRelativePosix(path, spec).startsWith("features/"),
  ).length;
  return aliasInversions + relativeInversions;
}

function routePropDrillingCount({ path, text }) {
  if (!APP_ROUTE_ENTRY.test(path)) return 0;
  const signature = text.match(
    /export\s+default\s+(?:async\s+)?function\s+\w*\s*\(\s*\{([^}]*)\}/s,
  );
  if (!signature) return 0;
  const inside = signature[1].trim();
  if (!inside) return 0;
  if (/\.\.\./.test(inside)) return 1;

  const keys = inside
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const key = part.split(":")[0].split("=")[0].trim();
      return key.replace(/^\.\.\./, "").trim();
    })
    .filter(Boolean);

  return keys.some((key) => !ALLOWED_ROUTE_KEYS.has(key)) ? 1 : 0;
}

function deepImportCount({ path, text }) {
  const posixPath = toPosixPath(path);
  const ownSlice = posixPath.match(/^features\/([^/]+)\//)?.[1];
  const specifiers = [
    ...text.matchAll(/from\s+["']@\/features\/([^/"']+)\/([^"']+)["']/g),
  ];
  // A slice has three public entries: index (client-safe), server (server-only) and actions (server actions).
  return specifiers.filter(
    ([, slice, rest]) =>
      slice !== ownSlice && rest !== "server" && rest !== "actions",
  ).length;
}

const metricsFor = (record) => {
  const posixPath = toPosixPath(record.path);
  return {
    deepImports: deepImportCount({ path: posixPath, text: record.text }),
    libToFeatures: posixPath.startsWith("lib/")
      ? inversionCount({ path: posixPath, text: record.text })
      : 0,
    routePropDrilling: routePropDrillingCount({
      path: posixPath,
      text: record.text,
    }),
    useEffect: count(record.text, /\buseEffect\(/g),
    anyTypes: count(record.text, /:\s*any\b|\bas any\b|<any>/g),
    incrementers: /^(features|lib)\//.test(posixPath)
      ? count(record.text, /\+\+[A-Za-z_$]|[A-Za-z_$]\+\+/g)
      : 0,
    clientComponents: /^\s*["']use client["']/.test(record.text) ? 1 : 0,
    largeFiles: record.text.split("\n").length > LARGE_FILE_LINES ? 1 : 0,
  };
};

export function measure(records) {
  return records
    .map(metricsFor)
    .reduce(
      (total, m) =>
        Object.fromEntries(
          Object.keys(m).map((key) => [key, (total[key] ?? 0) + m[key]]),
        ),
      {},
    );
}

export function compare(baseline, now) {
  return Object.keys(baseline)
    .filter((metric) => (now[metric] ?? 0) > baseline[metric])
    .map((metric) => ({
      metric,
      baseline: baseline[metric],
      now: now[metric],
    }));
}
