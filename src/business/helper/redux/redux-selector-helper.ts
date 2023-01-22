export function cmpUnicode(a: string, b: string) {
  // eslint-disable-next-line no-nested-ternary
  return a === b ? 0 : a < b ? -1 : 1
}

/** Compare function to sort entities by extracted string in unicode order. */
export function byString<T>(extracted: (entity: T) => string) {
  return (a: T, b: T) => cmpUnicode(extracted(a), extracted(b))
}

/** Compare function to sort entities by extracted string in current local order. */
export function byText<T>(
  extracted: (entity: T) => string,
  locales?: string | string[],
  options?: Intl.CollatorOptions,
) {
  const collator = new Intl.Collator(locales, options)
  return (a: T, b: T) => collator.compare(extracted(a), extracted(b))
}
