/**
 * Pure architecture metrics over { path, text } records. Lower is better for
 * every metric, which lets `compare` act as a one-way ratchet in CI.
 */

const LARGE_FILE_LINES = 300

const count = (text, pattern) => text.match(pattern)?.length ?? 0

function deepImportCount({ path, text }) {
  const ownSlice = path.match(/^features\/([^/]+)\//)?.[1]
  const specifiers = [...text.matchAll(/from\s+["']@\/features\/([^/"']+)\/[^"']+["']/g)]
  return specifiers.filter(([, slice]) => slice !== ownSlice).length
}

const metricsFor = (record) => ({
  deepImports: deepImportCount(record),
  libToFeatures: record.path.startsWith("lib/") ? count(record.text, /from\s+["']@\/features/g) : 0,
  useEffect: count(record.text, /\buseEffect\(/g),
  anyTypes: count(record.text, /:\s*any\b|\bas any\b|<any>/g),
  incrementers: /^(features|lib)\//.test(record.path) ? count(record.text, /\+\+[A-Za-z_$]|[A-Za-z_$]\+\+/g) : 0,
  clientComponents: /^\s*["']use client["']/.test(record.text) ? 1 : 0,
  largeFiles: record.text.split("\n").length > LARGE_FILE_LINES ? 1 : 0,
})

export function measure(records) {
  return records.map(metricsFor).reduce(
    (total, m) => Object.fromEntries(Object.keys(m).map((key) => [key, (total[key] ?? 0) + m[key]])),
    {},
  )
}

export function compare(baseline, now) {
  return Object.keys(baseline)
    .filter((metric) => (now[metric] ?? 0) > baseline[metric])
    .map((metric) => ({ metric, baseline: baseline[metric], now: now[metric] }))
}
