import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'

import Header from '../components/Header'

import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'

import { getLocale } from '#/paraglide/runtime'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    // Other redirect strategies are possible; see
    // https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', getLocale())
    }
  },

  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Verifidia',
      },
    ],
    links: [
      {
        rel: 'icon',
        href: '/favicon.ico',
        type: 'image/x-icon',
      },
      {
        rel: 'icon',
        href: '/logo192.png',
        type: 'image/png',
        sizes: '192x192',
      },
      {
        rel: 'apple-touch-icon',
        href: '/logo192.png',
        sizes: '192x192',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
    scripts: [
      {
        children: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}})()`,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang={getLocale()} className="h-full">
      <head>
        <HeadContent />
      </head>
      <body className="h-full flex flex-col antialiased">
        <TanStackQueryProvider>
          <Header />
          <main className="flex flex-1 flex-col bg-background w-full">
            {children}
          </main>
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}
