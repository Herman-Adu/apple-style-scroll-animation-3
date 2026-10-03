export function AdminLoading({ label }: { label: string }) {
  return (
    <p role="status" className="py-10 text-center text-muted-foreground">
      {`Loading ${label}…`}
    </p>
  )
}
