import { getArea, type AreaId } from "../lib/domain/site-structure"

/**
 * One area's tree, one slide.
 *
 * The slide this replaced put three columns of routes on a single page. They
 * outgrew it, and because the frame is `overflow-hidden` the overspill was
 * drawn straight over the signature. One tree per slide means the page cannot
 * overfill however the navigation grows, and `qa/social/export.spec.ts`
 * fails if it ever does.
 */
export function StructureBody({ area }: { area: AreaId }) {
  const { groups, forWhom } = getArea(area)
  // The admin nav has nine groups; in two columns that is five rows and the
  // last one lands on the signature. Three columns keeps any area to three rows.
  const columns = groups.length > 6 ? 3 : 2

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <p className="font-mono text-xl uppercase tracking-widest text-muted-foreground">{forWhom}</p>
      <ul
        className="grid flex-1 content-start gap-x-8 gap-y-6"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {groups.map((group) => (
          <li key={group.label} className="flex flex-col gap-2 border-t border-border pt-4">
            {/* The note rides on the heading line: on its own row it added a
                line to one group and pushed the docs slide past the footer. */}
            <span className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold leading-tight">{group.label}</span>
              {group.note ? (
                <span className="font-mono text-base uppercase tracking-widest text-primary">{group.note}</span>
              ) : null}
            </span>
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
