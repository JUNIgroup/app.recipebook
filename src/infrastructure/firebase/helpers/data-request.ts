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
   * @param responseBody the body as text or JSON, if the body was available. Should be set if response.bodyUsed is true.
   */
  constructor(
    message: string,
    public readonly request: Request,
    public readonly response?: Response,
    public readonly responseBody?: string | ReturnType<typeof JSON.parse>,
  ) {
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
 * Make a request with fetch.
 *
 * @param method the HTTP method to use
 * @param url the URL to request
 * @param payload the payload to send
 * @returns the request and response combined as a FetchResponse
 * @throws FetchError with response is undefined if the request fails at the network level
 */
export async function startRequestJson(method: Method, url: string, payload?: unknown): Promise<FetchResponse> {
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
  throw new FetchError(`Request failed with status code ${response.status} (${response.statusText})`, request, response)
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
    let body: unknown
    try {
      body = await response.text()
      body = JSON.parse(body as string)
      validate(body)
      return body
    } catch (error) {
      throw new FetchError(getErrorMessage(error), request, response, body)
    }
  }
}

async function printableBody(body: Body) {
  if (!body.body) return ''
  let printable: unknown = '...'
  try {
    printable = await body.text()
    printable = JSON.parse(printable as string)
  } catch {
    /* ignore */
  }
  return printable
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
    const responseBody = error.responseBody ?? (await printableBody(error.response))

    if (ok) {
      logger.error('Validation Error: %s', error.message)
      logger.error(`         Request: %s %s, headers: %o`, method, url, headers)
      logger.error(`        Response: %d %s`, status, statusText)
      logger.error('   Response-Body: %o', responseBody)
      throw new FirebaseError('SERVER_ERROR')
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

export type DataRequestQuery<T> = {
  method: Method
  url: string
  body?: unknown
  validate: ValidateFunction<T>
}

/**
 * Make a request with fetch and validate the response.
 *
 * This function is a wrapper around startRequestJson, checkStatus, and extractFetchData.
 *
 * @param query the information about the request to make
 * @returns the response JSON data, validated to ensure it matches the expected type
 */
export function requestJson<T>(query: DataRequestQuery<T>): Promise<T> {
  return startRequestJson(query.method, query.url, query.body) //
    .then(checkStatus)
    .then(extractFetchData(query.validate))
}
