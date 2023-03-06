import { Logger } from '../../logger/logger'
import { ValidateFunction } from '../../validation'
import { FirebaseError } from '../firebase-error'

export interface FetchResponse {
  request: Request
  response: Response
}

export class FetchError extends Error {
  /**
   * Creates a new FetchError.
   *
   * @param message the error message
   * @param request the request that failed
   * @param response the (optional) response that was received (e.g. 404, 500, etc.)
   */
  constructor(message: string, public readonly request: Request, public readonly response?: Response) {
    super(message)
    this.name = 'FetchError'
  }
}

/*
 * Possible error cases and how to detect and report them:
 * 1. Timeout (abort)
 *  - error is a DOMException
 *  - throw new FetchError(error, request) with DOMException.name === 'AbortError'
 * 2. Network error (e.g. no internet connection)
 *  - error is a TypeError
 *  - throw new FetchError(error, request)
 * 3. Server error (e.g. 404, 500, etc.)
 *  - throw new FetchError(null, request, response), but response.json() may fail
 * 4. Client error (e.g. 400, 401, etc.)
 *  - throw new FetchError(null, request, response), but response.json() may fail
 * 5. Unexpected response (e.g. 200, but response is not JSON or invalid JSON)
 *  - throw new FetchError(error, request, response), but response.json() may fail
 */

export type Method = 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'PURGE' | 'LINK' | 'UNLINK'

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

/**
 * Make a query with fetch.
 *
 * @param method the HTTP method to use
 * @param url the URL to query
 * @param payload the payload to send
 * @returns the request and response combined as a FetchResponse
 * @throws FetchError with response is undefined if the request fails at the network level
 */
export async function startQuery(method: Method, url: string, payload?: unknown): Promise<FetchResponse> {
  const request = new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
  })

  try {
    const response = await fetch(request)
    return { request, response }
  } catch (error) {
    throw new FetchError(getErrorMessage(error), request)
  }
}

export function checkStatus({ request, response }: FetchResponse): FetchResponse {
  if (response.ok) {
    return { request, response }
  }
  throw new FetchError(`Query failed with status ${response.status} ${response.statusText}`, request, response)
}

/**
 * Extracts the data from the response and validates it.
 *
 * @param logger the logger to use
 * @param validate the validation function to use
 * @returns a function that extracts the data from the response and validates it.
 */
export function extractFetchData<T>(validate: ValidateFunction<T>): (requestResponse: FetchResponse) => Promise<T> {
  return async ({ request, response }: FetchResponse) => {
    try {
      const data = await response.json()
      validate(data)
      return data
    } catch (error) {
      throw new FetchError(getErrorMessage(error), request, response)
    }
  }
}

async function printableBody(body: Body) {
  if (!body.body) return ''
  try {
    const text = await body.text()
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  } catch {
    return '...'
  }
}

function printableHeaders(headers: Headers) {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

/**
 * Converts a fetch error into a FirebaseError.
 *
 * @param logger the logger to use
 * @returns a function that converts a fetch error into a FirebaseError.
 */
export function fetchErrorHandler(logger: Logger): (error: unknown) => Promise<never> {
  return async (error) => {
    if (error instanceof FirebaseError) throw error

    if (!(error instanceof FetchError)) {
      logger.error('Unknown Error: %s', error instanceof Error ? error.message : error)
      throw new FirebaseError('UNKNOWN_ERROR')
    }
    const { method, url } = error.request
    const headers = printableHeaders(error.request.headers)

    if (!error.response) {
      logger.error('Network Error: %s', error.message)
      logger.error(`      Request: %s %s, headers: %o`, method, url, headers)
      throw new FirebaseError('NETWORK_ERROR')
    }

    const { ok, status, statusText } = error.response
    const requestBody = await printableBody(error.request)
    const responseBody = await printableBody(error.response)

    if (ok) {
      logger.error('Validation Error: %s', error.message)
      logger.error(`         Request: %s %s, headers: %o`, method, url, headers)
      logger.error(`        Response: %d %s`, status, statusText)
      logger.error('   Response-Body: %s', responseBody)
    }

    if (status !== 400) {
      logger.error(' Server Error: %s', error.message)
      logger.error(`      Request: %s %s, headers: %o`, method, url, headers)
      logger.error(` Request-Body: %o`, requestBody)
      logger.error(`     Response: %d %s`, status, statusText)
      logger.error('Response-Body: %o', responseBody)
      throw new FirebaseError('SERVER_ERROR')
    }

    const errorCode = responseBody.error?.message ?? 'SERVER_ERROR'
    logger.error('Firebase Error: %s', error.message)
    logger.error(`       Request: %s %s, headers: %o`, method, url, headers)
    logger.error(`  Request-Body: %o`, requestBody)
    logger.error(`      Response: %s`, errorCode)
    logger.error(` Response-Body: %o`, responseBody)
    throw new FirebaseError(errorCode)
  }
}
