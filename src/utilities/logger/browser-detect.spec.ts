// @vitest-environment happy-dom

import { detectColorMode, detectChrome } from './browser-detect'

describe('detectColorMode', () => {
  const results = { dark: 'dark', light: 'light', other: 'other' }
  it('should return dark when prefers-color-scheme: dark', () => {
    // arrange
    const matchMedia = (query: string) => ({ matches: query === '(prefers-color-scheme: dark)' }) as MediaQueryList
    vi.spyOn(window, 'matchMedia').mockImplementation(matchMedia)

    // act
    const result = detectColorMode(results)

    // assert
    expect(result).toBe(results.dark)
  })

  it('should return light when prefers-color-scheme: light', () => {
    // arrange
    const matchMedia = (query: string) => ({ matches: query === '(prefers-color-scheme: light)' }) as MediaQueryList
    vi.spyOn(window, 'matchMedia').mockImplementation(matchMedia)

    // act
    const result = detectColorMode(results)

    // assert
    expect(result).toBe(results.light)
  })

  it('should return other when prefers-color-scheme is not defined', () => {
    // arrange
    const matchMedia = () => ({ matches: false }) as MediaQueryList
    vi.spyOn(window, 'matchMedia').mockImplementation(matchMedia)

    // act
    const result = detectColorMode(results)

    // assert
    expect(result).toBe(results.other)
  })
})

describe('detectChrome', () => {
  it('should return true when user agent is chrome', () => {
    // arrange
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('chrome')

    // act
    const result = detectChrome()

    // assert
    expect(result).toBe(true)
  })

  it('should return false when user agent is not chrome', () => {
    // arrange
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('firefox')

    // act
    const result = detectChrome()

    // assert
    expect(result).toBe(false)
  })
})
