import { fetch, Headers, Request, Response } from 'cross-fetch'

if (import.meta.env.MODE !== 'test') {
  throw new Error(`This file should only be imported in test mode but you are in mode: ${import.meta.env.MODE}`)
}

export function defineGlobalFetchForTesting() {
  globalThis.fetch = fetch
  globalThis.Request = Request
  globalThis.Headers = Headers
  globalThis.Response = Response
}
