/** Special value to represent an unload data. To represents no data, use `null`. */
export const UNLOADED = undefined

/** Type safe filter to reject undefined and null */
export function dataFilter<T>(data: T | undefined | null): data is T {
  return data != null
}
