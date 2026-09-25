import { AdminShell } from "@/features/admin"
import { EmailTabs } from "@/features/admin/components/email/email-tabs"
import { MessageCenter } from "@/features/admin/components/email/message-center"
import { listMessages, listPresets } from "@/features/email/repo"

export const dynamic = "force-dynamic"

export default async function AdminEmailMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; name?: string }>
}) {
  const { to, name } = await searchParams
  const [presets, messages] = await Promise.all([listPresets(), listMessages()])
  return (
    <AdminShell title="Customer messages">
      <EmailTabs />
      <MessageCenter
        presets={presets.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          subject: p.subject,
          body: p.body,
        }))}
        messages={messages.map((m) => ({
          id: m.id,
          customerEmail: m.customerEmail,
          customerName: m.customerName,
          subject: m.subject,
          body: m.body,
          status: m.status,
          createdAt: m.createdAt,
        }))}
        prefillTo={to}
        prefillName={name}
      />
    </AdminShell>
  )
}
