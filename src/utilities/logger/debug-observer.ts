import { DEBUG } from './debug'

export type DebugStorage = {
  getItem(key: string): string | null | undefined
  setItem(key: string, value: string): void
}

export type DebugObserverOptions = {
  /**
   * The key of the local storage to observe.
   *
   * @default 'debug'
   *
   * @see https://www.npmjs.com/package/debug#browser-support
   * @see {@link DEBUG}
   */
  key?: string

  /**
   * The interval in milliseconds to observe the local storage for the key `DEBUG`.
   *
   * If set the interval to `0` the local storage will not be observed.
   *
   * @default 334 ms (3 times per second)
   */
  interval?: number

  /**
   * The storage to use to read/write the local storage key `DEBUG`.
   *
   * @default the system local storage
   */
  storage?: DebugStorage
}

/**
 * The callback of the debug observer.
 */
export type DebugObserverCallback = (namespaces: DEBUG) => void

/** API of the debug observer */
export interface DebugObserver {
  /**
   * The key of the local storage to observe.
   */
  readonly key: string

  /**
   * Read the namespaces from the local storage outside of the interval.
   *
   * If the value has changed since the last read the observer callback will be informed.
   */
  read(): string | null

  /**
   * Save the given namespaces to the local storage and inform the observer callback.
   *
   * @param namespaces the namespaces to save
   */
  save(namespaces: DEBUG): void

  /**
   * Stop observing the local storage.
   */
  stop(): void
}

export function createDebugObserver(callback: DebugObserverCallback, options?: DebugObserverOptions): DebugObserver {
  const key = options?.key ?? 'debug'
  const observeDebugInterval = options?.interval ?? 334
  const storage = options?.storage ?? window.localStorage

  let lastNamespaces: string | null | undefined = null

  function read(): string | null {
    const namespaces = storage.getItem(key)
    if (namespaces !== lastNamespaces) {
      lastNamespaces = namespaces
      callback(namespaces ?? '')
    }
    return namespaces ?? null
  }

  function save(namespaces: DEBUG): void {
    storage.setItem(key, namespaces)
    lastNamespaces = namespaces
    callback(namespaces)
  }

  const interval = observeDebugInterval > 0 ? setInterval(read, observeDebugInterval) : 0

  function stop(): void {
    clearInterval(interval)
  }

  read()

  return { key, read, save, stop }
}
