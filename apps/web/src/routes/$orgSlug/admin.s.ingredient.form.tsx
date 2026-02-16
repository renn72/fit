import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/admin/s/ingredient/form')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$orgSlug/admin/s/ingredient/form"!</div>
}
