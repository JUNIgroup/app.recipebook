export function detectColorMode<T>(results: { dark: T; light: T; other: T }): T {
  if (!('window' in globalThis)) return results.other

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return results.dark
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return results.light
  return results.other
}

export function detectChrome(): boolean {
  if (!('window' in globalThis)) return false
  return /chrome/i.test(window.navigator.userAgent)
}

export const isChrome = detectChrome()
