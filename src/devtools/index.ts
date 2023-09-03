import { Accessor, Owner, Setter, Signal, SignalOptions, batch, createSignal, getOwner } from 'solid-js'
import { SetStoreFunction, Store, createStore, reconcile } from 'solid-js/store'
import { reactiveDevTools, setNextAction } from './devtools'
import { trace } from './utils'

export type DevToolsOptions = {
  owner?: Owner | null
  name?: string
}

let signalId = 0

/**
 * Bind the signal to the redux devtools.
 *
 * @param get - a function that returns the value to be accessed
 * @param set - a (optional) function that sets the value to be accessed
 * @param options - optional object containing additional options
 */
export function devtoolsForSignal<T>(get: Accessor<T>, set?: Setter<T>, options: DevToolsOptions = {}) {
  if (import.meta.env.MODE === 'production') return
  const owner = options.owner ?? getOwner()
  if (owner == null) {
    trace('owner', 'is not defined')
    return
  }

  // eslint-disable-next-line no-plusplus
  const name = options.name ?? `sig-${signalId++}`

  reactiveDevTools({
    owner,
    name,
    toState: () => get(),
    fromState: set ? (value) => set(value) : undefined,
  })
}

/**
 * Create a signal and in non-production mode, bind it to the redux devtools.
 *
 * Otherwise, the same arguments as {@link createSignal}.
 */
export function createSignalWithDevtools<T>(): Signal<T | undefined>
export function createSignalWithDevtools<T>(value: T, options?: SignalOptions<T>): Signal<T>
export function createSignalWithDevtools<T>(value?: T, options?: SignalOptions<T>) {
  // eslint-disable-next-line solid/reactivity
  const signal = createSignal<T>(value as T, options)
  devtoolsForSignal(signal[0], signal[1], options)
  return signal
}

/**
 * Bind the store to the redux devtools.
 *
 * @param get - a function that returns the value to be accessed
 * @param set - a (optional) function that sets the value to be accessed
 * @param options - optional object containing additional options
 */
export function devtoolsForStore<T>(get: Store<T>, set?: SetStoreFunction<T>, options: DevToolsOptions = {}) {
  if (import.meta.env.MODE === 'production') return
  const owner = options.owner ?? getOwner()
  if (owner == null) {
    trace('owner', 'is not defined')
    return
  }

  reactiveDevTools({
    owner,
    name: options.name ?? owner?.name ?? 'store',
    toState: () => JSON.parse(JSON.stringify(get)),
    fromState: set ? (value) => set(reconcile(value)) : undefined,
  })
}

// eslint-disable-next-line @typescript-eslint/ban-types
type DefaultObject = {}

/**
 * Create a store and in non-production mode, bind it to the redux devtools.
 *
 * Otherwise, the same arguments as {@link createStore}.
 */
export function createStoreWithDevtools<T extends object = DefaultObject>(
  ...[value, options]: DefaultObject extends T
    ? [value?: T | Store<T>, options?: DevToolsOptions]
    : [value: T | Store<T>, options?: DevToolsOptions]
): [get: Store<T>, set: SetStoreFunction<T>] {
  // eslint-disable-next-line solid/reactivity
  const store = createStore<T>(value as T, options)
  devtoolsForStore(store[0], store[1], options)
  return store
}

/**
 * Run updates an batch mode.
 *
 * In non-production mode, set the type and payload of the next action for the redux devtools.
 *
 * @param action the type of the action
 * @param payload the payload
 * @param fn the same as in {@link batch}
 * @returns the result of {@link batch}
 */
export function batchWithDevtools<T>(action: string, payload: unknown, fn: Accessor<T>): T {
  if (import.meta.env.MODE !== 'production') setNextAction(action, payload)
  return batch(fn)
}
