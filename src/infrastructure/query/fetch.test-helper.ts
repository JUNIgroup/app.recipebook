import { fetch, Request, Headers, Response } from 'cross-fetch'

export function defineGlobalFetchForTesting() {
  global.fetch = fetch
  global.Request = Request
  global.Headers = Headers
  global.Response = Response
}
