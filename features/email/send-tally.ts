export type SendOutcome = { ok: true; skipped?: boolean } | { ok: false }

export interface SendTally {
  sent: number
  skipped: number
  failed: number
}

const outcomeKey = (result: SendOutcome): keyof SendTally => {
  if (!result.ok) return "failed"
  return result.skipped ? "skipped" : "sent"
}

export function tallySendResults(results: readonly SendOutcome[]): SendTally {
  return results.reduce<SendTally>(
    (tally, result) => {
      const key = outcomeKey(result)
      return { ...tally, [key]: tally[key] + 1 }
    },
    { sent: 0, skipped: 0, failed: 0 },
  )
}
