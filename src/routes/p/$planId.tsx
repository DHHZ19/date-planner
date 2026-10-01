import { createFileRoute, Link } from '@tanstack/react-router'
import { DatePlanResults } from '#/components/DatePlanResults'
import { getPlan } from '#/server-functions/plans'

export const Route = createFileRoute('/p/$planId')({
  loader: async ({ params }) => {
    return getPlan({ data: { planId: params.planId } })
  },
  component: SharedPlanPage,
  errorComponent: SharedPlanUnavailable,
})

function SharedPlanPage() {
  const result = Route.useLoaderData()

  if (result.status === 'ok') {
    return <DatePlanResults datePlan={result.plan} variant="shared" />
  }

  return <MissingPlan status={result.status} />
}

function SharedPlanUnavailable() {
  return <MissingPlan status="unavailable" />
}

function MissingPlan({ status }: { status: 'missing' | 'unavailable' }) {
  const title =
    status === 'unavailable'
      ? 'This plan could not be loaded'
      : 'This plan is no longer available'
  const message =
    status === 'unavailable'
      ? 'Plan storage is unavailable right now. Try the link again in a moment, or start a new date plan.'
      : 'This share link is missing or has expired. Date plans stay available for about 30 days.'

  return (
    <main className="page-wrap px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-[var(--ui-text)]">
          {title}
        </h1>
        <p className="mt-3 text-base text-[var(--ui-text-muted)]">{message}</p>
        <Link
          to="/"
          className="mx-auto mt-6 inline-block rounded-2xl border-2 border-b-4 border-[var(--love-900)] bg-[var(--love-700)] px-6 py-2.5 text-base font-bold text-white active:translate-y-[2px] active:border-b-2"
        >
          Plan a date
        </Link>
      </div>
    </main>
  )
}
