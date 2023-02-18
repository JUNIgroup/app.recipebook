/**
 * A promise with a resolve and reject function attached to it.
 */
export type Subject<T> = Promise<T> & { resolve: (value: T) => void; reject: (reason?: unknown) => void }

/**
 * Create a promise with a resolve and reject function attached to it.
 * @returns a subject
 */
export function subject<T>(): Subject<T> {
  let resolve: (value: T) => void = () => {}
  let reject: (reason?: unknown) => void = () => {}
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  }) as Subject<T>
  promise.resolve = resolve
  promise.reject = reject
  return promise
}
