/** Function for the sort method, e.g. arrays of type T */
export type Order<T> = (a: T, b: T) => number

/**
 * Order the items by the string computed by the given extractor.
 *
 * @param extractor computes the string to compare
 * @returns the order function
 */
export function byString<T>(extractor: (item: T) => string): Order<T> {
  return (a: T, b: T) => extractor(a).localeCompare(extractor(b))
}

/**
 * Order the items by the number computed by the given extractor.
 *
 * @param extractor computes the number to compare
 * @returns the order function
 */
export function byNumber<T>(extractor: (item: T) => number): Order<T> {
  return (a: T, b: T) => compareNumber(extractor(a), extractor(b))
}

function compareNumber(a: number, b: number): number {
  if (a === b) return 0
  return a < b ? -1 : 1
}

/**
 * This function reverses the order of a given order.
 *
 * For example, if the given order is ascending, the returned order will be descending.
 * The given order must be a valid order.
 */
export function reverseOrder<T>(order: Order<T>): Order<T> {
  return (a, b) => order(b, a)
}
