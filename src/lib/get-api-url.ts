const SSR_FALLBACK_ORIGIN = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

export function getApiUrl(path: string): string {
  if (!import.meta.env.SSR) {
    return path
  }

  return new URL(path, SSR_FALLBACK_ORIGIN).toString()
}
