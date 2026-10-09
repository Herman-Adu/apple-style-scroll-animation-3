import { getArea, type AreaId } from "../lib/domain/site-structure"

/**
 * One area's tree, one slide.
 *
 * The slide this replaced put three columns of routes on a single page. They
 * outgrew it, and because the frame is `overflow-hidden` the overspill was
 * drawn straight over the signature. One tree per slide means the page cannot
 * overfill however the navigation grows, and `qa/smoke/slide-overflow.spec.ts`
 * fails if it ever does.
 */
export function StructureBody({ area }: { area: AreaId }) {
  const { groups, forWhom } = getArea(area)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <p className="font-mono text-xl uppercase tracking-widest text-muted-foreground">{forWhom}</p>
      <ul className="grid flex-1 grid-cols-2 content-start gap-x-10 gap-y-6">
        {groups.map((group) => (
          <li key={group.label} className="flex flex-col gap-2 border-t border-border pt-4">
            <span className="text-3xl font-semibold leading-tight">{group.label}</span>
            {group.path ? <span className="font-mono text-lg text-muted-foreground">{group.path}</span> : null}
            {group.children.length > 0 ? (
              <ul className="flex flex-col gap-1 pt-1">
                {group.children.map((child) => (
                  <li key={child.label} className="text-xl leading-snug text-muted-foreground">
                    {child.label}
                    {child.note ? <span className="text-primary"> · {child.note}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
