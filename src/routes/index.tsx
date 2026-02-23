import { createFileRoute } from '@tanstack/react-router'
import * as m from '#/paraglide/messages'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
          {m.site_title()}
        </h1>
        <p className="text-lg text-muted-foreground">
          {m.site_tagline()}
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {m.home_recent()}
        </h2>
        <p className="text-muted-foreground">
          Articles will appear here once generated.
        </p>
      </section>
    </div>
  )
}
