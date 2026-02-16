import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/admin/s/exercise/form')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$orgSlug/admin/s/exercise/form"!</div>
}
