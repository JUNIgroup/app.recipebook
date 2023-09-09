/* eslint-disable no-underscore-dangle */
import { Config } from '@redux-devtools/extension'
import { trace } from './utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ANY = any

export interface Action<T = unknown> {
  type: string
  payload?: T
}

interface Message {
  type: string
  state: string
  payload?: { type: string }
}

interface ConnectResponse {
  init(state: unknown): void
  send(action: Action<unknown>, state: unknown): void
  subscribe(listener: (state: Message) => void): () => void
  unsubscribe(): void
}

export interface ReduxDevtoolsExtension {
  connect: (preConfig: Config) => ConnectResponse
}

export function getReduxExtension(): ReduxDevtoolsExtension | null {
  try {
    if (globalThis.window && '__REDUX_DEVTOOLS_EXTENSION__' in globalThis.window) {
      // eslint-disable-next-line no-underscore-dangle
      return ((window as ANY).__REDUX_DEVTOOLS_EXTENSION__ as ReduxDevtoolsExtension | null | undefined) ?? null
    }
  } catch {
    // ignore
  }
  if (globalThis.window && import.meta.env.MODE !== 'production' && import.meta.env.MODE !== 'test') {
    ;(globalThis.window as ANY).__REDUX_DEVTOOLS_EXTENSION__ = null
    trace('redux devtools', `Please install Redux devtools extension\nhttps://github.com/reduxjs/redux-devtools`)
  }
  return null
}
