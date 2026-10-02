"use client"

import { useState, useTransition } from "react"
import useSWR from "swr"
import { History, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { listTemplateVersionsAction } from "@/features/email"
import { summarizeChange, type TemplateContent } from "@/features/email"

type Version = Awaited<ReturnType<typeof listTemplateVersionsAction>>[number]

const REASON_LABEL: Record<string, string> = {
  create: "Created",
  save: "Saved",
  reset: "Reset",
  restore: "Restored",
  baseline: "Earliest saved",
}

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" })

export function VersionHistory({
  templateId,
  currentVersion,
  dirty,
  onRestore,
}: {
  templateId: number
  /** Changes whenever the template is saved, so the list refetches. */
  currentVersion: number
  dirty: boolean
  onRestore: (versionId: number) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  const { data, isLoading, mutate } = useSWR(
    open ? ["template-versions", templateId, currentVersion] : null,
    () => listTemplateVersionsAction(templateId),
  )

  function restore(v: Version) {
    setRestoringId(v.id)
    startTransition(async () => {
      const ok = await onRestore(v.id)
      setRestoringId(null)
      if (ok) {
        await mutate()
        setOpen(false)
      }
    })
  }

  const versions = data ?? []

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" title="See and restore earlier saved versions">
          <History className="size-4" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Version history</SheetTitle>
          <SheetDescription>
            Every save is kept. Restoring a version saves it as a new version, so you can always come back.
          </SheetDescription>
        </SheetHeader>

        {dirty ? (
          <p className="border-b border-border bg-muted/50 px-4 py-2 text-xs leading-relaxed text-muted-foreground">
            You have unsaved changes. Restoring a version will replace them.
          </p>
        ) : null}

        <ol className="flex-1 overflow-y-auto p-2" aria-busy={isLoading}>
          {isLoading ? (
            <li className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading versions
            </li>
          ) : versions.length === 0 ? (
            <li className="p-8 text-center text-sm text-muted-foreground">No versions yet. Save to create one.</li>
          ) : (
            versions.map((v, i) => {
              const isCurrent = i === 0
              const older = versions[i + 1] as TemplateContent | undefined
              const changes = older ? summarizeChange(older, v) : []
              return (
                <li key={v.id} className="flex flex-col gap-2 rounded-lg p-3 hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">v{v.version}</span>
                    <Badge variant="secondary" className="font-normal">
                      {REASON_LABEL[v.reason] ?? v.reason}
                    </Badge>
                    {isCurrent ? (
                      <Badge variant="outline" className="font-normal">
                        Current
                      </Badge>
                    ) : null}
                    <time className="ml-auto text-xs text-muted-foreground" dateTime={v.createdAt}>
                      {dateFmt.format(new Date(v.createdAt))}
                    </time>
                  </div>
                  <p className="truncate text-sm text-foreground">{v.subject || v.name}</p>
                  {changes.length ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">Changed: {changes.join(", ")}</p>
                  ) : null}
                  {!isCurrent ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 self-start px-2"
                      disabled={restoringId !== null}
                      onClick={() => restore(v)}
                    >
                      {restoringId === v.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="size-3.5" />
                      )}
                      Restore this version
                    </Button>
                  ) : null}
                </li>
              )
            })
          )}
        </ol>
      </SheetContent>
    </Sheet>
  )
}
