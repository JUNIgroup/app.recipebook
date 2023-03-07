import { boolean, Infer, number, object, optional, string } from 'superstruct'
import { FakeLogger } from '../../logger/fake-logger.test-helper'
import { Logger } from '../../logger/logger'
import { defineGlobalFetchForTesting } from '../../query/fetch.test-helper'
import { ValidateFunction } from '../../validation/index'
import { createValidationFunction } from '../../validation/superstruct.extend'
import { FirebaseError } from '../firebase-error'
import {
  checkStatus,
  extractFetchData,
  FetchError,
  fetchErrorHandler,
  DataRequestQuery,
  requestJson,
  startRequestJson,
} from './data-request'

defineGlobalFetchForTesting()

const SampleTestDataStruct = object({
  foo: string(),
  bar: number(),
  baz: optional(boolean()),
})

type SampleTestData = Infer<typeof SampleTestDataStruct>

const assertSampleTestData: ValidateFunction<SampleTestData> = createValidationFunction(SampleTestDataStruct)

function mockAbortError() {
  const abortError = new Error('The user aborted a request.')
  abortError.name = 'AbortError'
  return abortError
}

describe('mockAbortError', () => {
  it('should match abort error thrown by fetch in message and name', async () => {
    // arrange
    const abortController = new AbortController()
    const act = fetch('http://example.com', {
      signal: abortController.signal,
    })
    abortController.abort()
    const thrown = await act.then(() => undefined).catch((e) => e as Error)

    // act
    const abortError = mockAbortError()

    // assert
    expect(abortError.message).toEqual(thrown?.message)
    expect(abortError.name).toEqual(thrown?.name)
  })
})

describe('startRequestJson', () => {
  it('should return request/response if fetch does not throw an error', async () => {
    // arrange
    const request = new Request('http://localhost:8080', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ pay: 'load' }),
    })
    const response = new Response('', { status: 200 })

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)

    // act
    const result = await startRequestJson('POST', 'http://localhost:8080', { pay: 'load' })

    // assert
    expect(result).toEqual({ request, response })
  })

  it('should return FetchError if fetch throws an abort error', async () => {
    // arrange
    const error = mockAbortError()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(error)

    // act
    const query = startRequestJson('POST', 'http://localhost:8080', { pay: 'load' })
    const thrown = await query.then(() => undefined).catch((e) => e as FetchError)

    // assert
    expect(thrown).toBeInstanceOf(FetchError)
    expect(thrown?.message).toEqual(error.message)
    expect(thrown?.request).toEqual(
      new Request('http://localhost:8080', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ pay: 'load' }),
      }),
    )
  })

  it('should return FetchError if fetch throws a type error', async () => {
    // arrange
    const error = new TypeError('offline')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(error)

    // act
    const query = startRequestJson('POST', 'http://localhost:8080', { pay: 'load' })
    const thrown = await query.then(() => undefined).catch((e) => e as FetchError)

    // assert
    expect(thrown).toBeInstanceOf(FetchError)
    expect(thrown?.message).toEqual('offline')
    expect(thrown?.request).toEqual(
      new Request('http://localhost:8080', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ pay: 'load' }),
      }),
    )
  })

  it('should return FetchError if fetch throws an unexpected other error', async () => {
    // arrange
    const error = 'something else happened'
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(error)

    // act
    const query = startRequestJson('POST', 'http://localhost:8080', { pay: 'load' })
    const thrown = await query.then(() => undefined).catch((e) => e as FetchError)

    // assert
    expect(thrown).toBeInstanceOf(FetchError)
    expect(thrown?.message).toEqual('something else happened')
    expect(thrown?.request).toEqual(
      new Request('http://localhost:8080', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ pay: 'load' }),
      }),
    )
  })
})

describe('checkStatus', () => {
  it('should return the request/response if the status is 200', () => {
    // arrange
    const request = new Request('http://localhost:8080')
    const response = new Response('', { status: 200 })

    // act
    const result = checkStatus({ request, response })

    // assert
    expect(result).toEqual({ request, response })
  })

  it.each`
    status | statusText
    ${304} | ${'Not Modified'}
    ${400} | ${'Bad Request'}
    ${404} | ${'Not Found'}
    ${500} | ${'Internal Server Error'}
  `('should throw a FetchError if the status is an error status code $status', async ({ status, statusText }) => {
    // arrange
    const request = new Request('http://localhost:8080')
    const response = new Response('', { status })

    // act
    const act = async () => checkStatus({ request, response })
    const result = await act().catch((e) => e)

    // assert
    expect(result).toBeInstanceOf(FetchError)
    expect(result.message).toEqual(`Request failed with status code ${status} (${statusText})`)
    expect(result.request).toBe(request)
    expect(result.response).toBe(response)
  })
})

describe('extractFetchData', () => {
  it('should return a handler function', () => {
    // act
    const handler = extractFetchData(assertSampleTestData)

    // assert
    expect(handler).toBeInstanceOf(Function)
  })

  it('should extract valid data from response', async () => {
    // arrange
    const payload: SampleTestData = { foo: 'foo', bar: 1, baz: true }
    const request = new Request('http://localhost:8080')
    const response = new Response(JSON.stringify(payload), { status: 200 })
    const handler = extractFetchData(assertSampleTestData)

    // act
    const data = await handler({ request, response })

    // assert
    expect(data).toEqual({ foo: 'foo', bar: 1, baz: true })
  })

  it('should throw fetch error if payload is JSON but not valid', async () => {
    // arrange
    const payload = { foo: 123 }
    const request = new Request('http://localhost:8080')
    const response = new Response(JSON.stringify(payload), { status: 200 })
    const handler = extractFetchData(assertSampleTestData)

    // act
    const thrown = await handler({ request, response }).catch((e) => e)

    // assert
    expect(thrown).toBeInstanceOf(FetchError)
    expect(thrown.message).toEqual('At path: foo -- Expected a string, but received: 123')
    expect(thrown.request).toBe(request)
    expect(thrown.response).toBe(response)
  })

  it('should throw fetch error if payload is not JSON', async () => {
    // arrange
    const payload = 'not a json'
    const request = new Request('http://localhost:8080')
    const response = new Response(payload, { status: 200 })
    const handler = extractFetchData(assertSampleTestData)

    // act
    const thrown = await handler({ request, response }).catch((e) => e)

    // assert
    expect(thrown).toBeInstanceOf(FetchError)
    expect(thrown.message).toInclude('Unexpected token o in JSON at position 1')
    expect(thrown.request).toBe(request)
    expect(thrown.response).toBe(response)
  })
})

describe('fetchErrorHandler', () => {
  let request: Request

  beforeEach(() => {
    const requestHeaders = new Headers({
      Accept: 'application/json',
      'Accept-Charset': 'utf-8',
      'Content-Type': 'application/json',
    })
    request = new Request('http://localhost:8080', {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({ pay: 'load' }),
    })
  })

  it('should return a handler function', () => {
    // arrange
    const logger = { error: () => {} } as Logger

    // act
    const handler = fetchErrorHandler(logger)

    // assert
    expect(handler).toBeInstanceOf(Function)
  })

  describe('the returned error handler', () => {
    it('should rethrow FirebaseError', async () => {
      // arrange
      const logger = new FakeLogger()
      const handler = fetchErrorHandler(logger)
      const error = new FirebaseError('EMAIL_NOT_FOUND')

      // act
      const thrown = await handler(error).catch((e) => e)

      // assert
      expect(thrown).toBe(error)
      expect(logger.output).not.toHaveBeenCalled()
    })

    it('should throw unknown FirebaseError for non-error', async () => {
      // arrange
      const logger = new FakeLogger()
      const handler = fetchErrorHandler(logger)
      const error = 'error text only'

      // act
      const thrown = await handler(error).catch((e) => e)

      // assert
      expect(thrown).toBeInstanceOf(FirebaseError)
      expect(thrown).toEqual(new FirebaseError('UNKNOWN_ERROR'))
      expect(logger.output).toHaveBeenCalledWith('[ERROR] Unknown Error: error text only')
    })

    it('should throw unknown FirebaseError for non FetchError', async () => {
      // arrange
      const logger = new FakeLogger()
      const handler = fetchErrorHandler(logger)
      const error = new Error('error but not a fetch error')

      // act
      const thrown = await handler(error).catch((e) => e)

      // assert
      expect(thrown).toBeInstanceOf(FirebaseError)
      expect(thrown).toEqual(new FirebaseError('UNKNOWN_ERROR'))
      expect(logger.output).toHaveBeenCalledWith('[ERROR] Unknown Error: error but not a fetch error')
    })

    it('should throw network FirebaseError for a wrapped AbortError', async () => {
      // arrange
      const logger = new FakeLogger()
      const handler = fetchErrorHandler(logger)
      const error = new FetchError(mockAbortError().message, request)

      // act
      const thrown = await handler(error).catch((e) => e)

      // assert
      expect(thrown).toBeInstanceOf(FirebaseError)
      expect(thrown).toEqual(new FirebaseError('NETWORK_ERROR'))
      expect(logger.output).toHaveBeenCalledWith('[ERROR] Network Error: The user aborted a request.')
    })

    it('should throw network FirebaseError for a FetchError without response', async () => {
      // arrange
      const logger = new FakeLogger()
      const handler = fetchErrorHandler(logger)
      const error = new FetchError(
        'fetch error without response', // message
        request,
      )
      const headers = '{ accept: application/json, accept-charset: utf-8, content-type: application/json }'

      // act
      const thrown = await handler(error).catch((e) => e)

      // assert
      expect(thrown).toBeInstanceOf(FirebaseError)
      expect(thrown).toEqual(new FirebaseError('NETWORK_ERROR'))
      expect(logger.lines).toEqual([
        '[ERROR] Network Error: fetch error without response',
        `[ERROR]       Request: POST http://localhost:8080/, headers: ${headers}`,
      ])
    })

    it('should throw server FirebaseError for a FetchError with response and status !== 400 and response body as HTML', async () => {
      // arrange
      const logger = new FakeLogger()
      const handler = fetchErrorHandler(logger)
      const response = new Response('<html>...</html>', {
        status: 404,
        statusText: 'Not Found',
      })
      const error = new FetchError(
        'Request failed with status code 404', // message
        request,
        response,
      )
      const headers = '{ accept: application/json, accept-charset: utf-8, content-type: application/json }'

      // act
      const thrown = await handler(error).catch((e) => e)

      // assert
      expect(thrown).toBeInstanceOf(FirebaseError)
      expect(thrown).toEqual(new FirebaseError('SERVER_ERROR'))
      expect(logger.lines).toEqual([
        '[ERROR]  Server Error: Request failed with status code 404',
        `[ERROR]       Request: POST http://localhost:8080/, headers: ${headers}`,
        `[ERROR]  Request-Body: { pay: load }`,
        `[ERROR]      Response: 404 Not Found`,
        `[ERROR] Response-Body: <html>...</html>`,
      ])
    })

    it('should throw server FirebaseError for a FetchError with response and status !== 400 and response body as JSON', async () => {
      // arrange
      const logger = new FakeLogger()
      const handler = fetchErrorHandler(logger)
      const response = new Response(JSON.stringify({ foo: 'bar' }), {
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      })
      const error = new FetchError(
        'Request failed with status code 404', // message
        request,
        response,
      )
      const headers = '{ accept: application/json, accept-charset: utf-8, content-type: application/json }'

      // act
      const thrown = await handler(error).catch((e) => e)

      // assert
      expect(thrown).toBeInstanceOf(FirebaseError)
      expect(thrown).toEqual(new FirebaseError('SERVER_ERROR'))
      expect(logger.lines).toEqual([
        '[ERROR]  Server Error: Request failed with status code 404',
        `[ERROR]       Request: POST http://localhost:8080/, headers: ${headers}`,
        `[ERROR]  Request-Body: { pay: load }`,
        `[ERROR]      Response: 404 Not Found`,
        `[ERROR] Response-Body: { foo: bar }`,
      ])
    })

    it('should throw server FirebaseError for a FetchError with response and status === 400 and response body non-expected error JSON', async () => {
      // arrange
      const logger = new FakeLogger()
      const handler = fetchErrorHandler(logger)
      const response = new Response(JSON.stringify({ foo: 'bar' }), {
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      })
      const error = new FetchError(
        'Request failed with status code 400', // message
        request,
        response,
      )
      const headers = '{ accept: application/json, accept-charset: utf-8, content-type: application/json }'

      // act
      const thrown = await handler(error).catch((e) => e)

      // assert
      expect(thrown).toBeInstanceOf(FirebaseError)
      expect(thrown).toEqual(new FirebaseError('SERVER_ERROR'))
      expect(logger.lines).toEqual([
        '[ERROR] Firebase Error: Request failed with status code 400',
        `[ERROR]        Request: POST http://localhost:8080/, headers: ${headers}`,
        `[ERROR]   Request-Body: { pay: load }`,
        `[ERROR]       Response: SERVER_ERROR`,
        `[ERROR]  Response-Body: { foo: bar }`,
      ])
    })

    it('should throw server FirebaseError for a firebase response with error EMAIL_NOT_FOUND', async () => {
      // arrange
      const logger = new FakeLogger()
      const handler = fetchErrorHandler(logger)
      const response = new Response(JSON.stringify({ error: { message: 'EMAIL_NOT_FOUND' } }), {
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      })
      const error = new FetchError(
        'Request failed with status code 400', // message
        request,
        response,
      )
      const headers = '{ accept: application/json, accept-charset: utf-8, content-type: application/json }'

      // act
      const thrown = await handler(error).catch((e) => e)

      // assert
      expect(thrown).toBeInstanceOf(FirebaseError)
      expect(thrown).toEqual(new FirebaseError('EMAIL_NOT_FOUND'))
      expect(logger.lines).toEqual([
        '[ERROR] Firebase Error: Request failed with status code 400',
        `[ERROR]        Request: POST http://localhost:8080/, headers: ${headers}`,
        `[ERROR]   Request-Body: { pay: load }`,
        `[ERROR]       Response: EMAIL_NOT_FOUND`,
        `[ERROR]  Response-Body: { error: { message: EMAIL_NOT_FOUND } }`,
      ])
    })
  })
})

describe('queryJson with fetchErrorHandler', () => {
  // the query used for all tests
  let sampleTestDataQuery: DataRequestQuery<SampleTestData>

  // a new empty fake logger for each test
  let logger: FakeLogger

  // the expected log for the request, if the query logs any errors
  const expectedRequestLog =
    'POST http://localhost:8080/sampleTestData, headers: { accept: application/json, content-type: application/json }'

  beforeEach(() => {
    sampleTestDataQuery = {
      method: 'POST',
      url: 'http://localhost:8080/sampleTestData',
      body: { pay: 'load' },
      validate: assertSampleTestData,
    }
    logger = new FakeLogger()
  })

  function mockFetchWithError(error: Error) {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(error)
  }

  function mockFetchWithResponse(status: number, body: string) {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body, {
        status,
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      }),
    )
  }

  afterEach(() => {
    vi.mocked(global.fetch).mockRestore()
  })

  it(`should return JSON from response`, async () => {
    // arrange
    mockFetchWithResponse(200, JSON.stringify({ foo: 'X', bar: 42, baz: true }))

    // act
    const query = requestJson(sampleTestDataQuery).catch(fetchErrorHandler(logger))

    // assert
    await expect(query).resolves.toEqual({ foo: 'X', bar: 42, baz: true })
    expect(logger.lines).toEqual([])
  })

  it(`should throw network FirebaseError for fetch was aborted`, async () => {
    // arrange
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    mockFetchWithError(abortError)

    // act
    const query = requestJson(sampleTestDataQuery).catch(fetchErrorHandler(logger))

    // assert
    await expect(query).rejects.toThrow(FirebaseError)
    await expect(query).rejects.toThrow(new FirebaseError('NETWORK_ERROR'))
    expect(logger.lines).toEqual([
      `[ERROR] Network Error: aborted`, //
      `[ERROR]       Request: ${expectedRequestLog}`,
    ])
  })

  it(`should throw network FirebaseError for fetch failed with a type error`, async () => {
    mockFetchWithError(new TypeError('offline'))

    // act
    const query = requestJson(sampleTestDataQuery).catch(fetchErrorHandler(logger))

    // assert
    await expect(query).rejects.toThrow(FirebaseError)
    await expect(query).rejects.toThrow(new FirebaseError('NETWORK_ERROR'))
    expect(logger.lines).toEqual([
      `[ERROR] Network Error: offline`, //
      `[ERROR]       Request: ${expectedRequestLog}`,
    ])
  })

  it(`should throw client FirebaseError for server error response with status 400 and error USER_NOT_FOUND`, async () => {
    // arrange
    mockFetchWithResponse(400, JSON.stringify({ error: { message: 'USER_NOT_FOUND' } }))

    // act
    const query = requestJson(sampleTestDataQuery).catch(fetchErrorHandler(logger))

    // assert
    await expect(query).rejects.toThrow(FirebaseError)
    await expect(query).rejects.toThrow(new FirebaseError('USER_NOT_FOUND'))
    expect(logger.lines).toEqual([
      `[ERROR] Firebase Error: Request failed with status code 400 (Bad Request)`, //
      `[ERROR]        Request: ${expectedRequestLog}`,
      `[ERROR]   Request-Body: { pay: load }`,
      `[ERROR]       Response: USER_NOT_FOUND`,
      `[ERROR]  Response-Body: { error: { message: USER_NOT_FOUND } }`,
    ])
  })

  it(`should throw server FirebaseError for server error response with status 404`, async () => {
    // arrange
    mockFetchWithResponse(404, 'resource not found')

    // act
    const query = requestJson(sampleTestDataQuery).catch(fetchErrorHandler(logger))

    // assert
    await expect(query).rejects.toThrow(FirebaseError)
    await expect(query).rejects.toThrow(new FirebaseError('SERVER_ERROR'))
    expect(logger.lines).toEqual([
      `[ERROR]  Server Error: Request failed with status code 404 (Not Found)`, //
      `[ERROR]       Request: ${expectedRequestLog}`,
      `[ERROR]  Request-Body: { pay: load }`,
      `[ERROR]      Response: 404 Not Found`,
      `[ERROR] Response-Body: resource not found`,
    ])
  })

  it(`should throw server FirebaseError for server error response with status 500`, async () => {
    // arrange
    mockFetchWithResponse(500, 'server overloaded - try later')

    // act
    const query = requestJson(sampleTestDataQuery).catch(fetchErrorHandler(logger))

    // assert
    await expect(query).rejects.toThrow(FirebaseError)
    await expect(query).rejects.toThrow(new FirebaseError('SERVER_ERROR'))
    expect(logger.lines).toEqual([
      `[ERROR]  Server Error: Request failed with status code 500 (Internal Server Error)`, //
      `[ERROR]       Request: ${expectedRequestLog}`,
      `[ERROR]  Request-Body: { pay: load }`,
      `[ERROR]      Response: 500 Internal Server Error`,
      `[ERROR] Response-Body: server overloaded - try later`,
    ])
  })

  it(`should throw server FirebaseError for server error response with status 400 but unstructured error body`, async () => {
    // arrange
    mockFetchWithResponse(400, 'some error')

    // act
    const query = requestJson(sampleTestDataQuery).catch(fetchErrorHandler(logger))

    // assert
    await expect(query).rejects.toThrow(FirebaseError)
    await expect(query).rejects.toThrow(new FirebaseError('SERVER_ERROR'))
    expect(logger.lines).toEqual([
      `[ERROR] Firebase Error: Request failed with status code 400 (Bad Request)`, //
      `[ERROR]        Request: ${expectedRequestLog}`,
      `[ERROR]   Request-Body: { pay: load }`,
      `[ERROR]       Response: SERVER_ERROR`,
      `[ERROR]  Response-Body: some error`,
    ])
  })

  it(`should throw server FirebaseError for server error response with status 400 but error body with no message`, async () => {
    // arrange
    mockFetchWithResponse(400, JSON.stringify({ error: {} }))

    // act
    const query = requestJson(sampleTestDataQuery).catch(fetchErrorHandler(logger))

    // assert
    await expect(query).rejects.toThrow(FirebaseError)
    await expect(query).rejects.toThrow(new FirebaseError('SERVER_ERROR'))
    expect(logger.lines).toEqual([
      `[ERROR] Firebase Error: Request failed with status code 400 (Bad Request)`, //
      `[ERROR]        Request: ${expectedRequestLog}`,
      `[ERROR]   Request-Body: { pay: load }`,
      `[ERROR]       Response: SERVER_ERROR`,
      `[ERROR]  Response-Body: { error: {} }`,
    ])
  })

  it(`should throw server FirebaseError for server error response with status 400 but error body with no error`, async () => {
    // arrange
    mockFetchWithResponse(400, JSON.stringify({ foo: 'bar' }))

    // act
    const query = requestJson(sampleTestDataQuery).catch(fetchErrorHandler(logger))

    // assert
    await expect(query).rejects.toThrow(FirebaseError)
    await expect(query).rejects.toThrow(new FirebaseError('SERVER_ERROR'))
    expect(logger.lines).toEqual([
      `[ERROR] Firebase Error: Request failed with status code 400 (Bad Request)`, //
      `[ERROR]        Request: ${expectedRequestLog}`,
      `[ERROR]   Request-Body: { pay: load }`,
      `[ERROR]       Response: SERVER_ERROR`,
      `[ERROR]  Response-Body: { foo: bar }`,
    ])
  })

  it(`should throw server FirebaseError for server ok response but without valid json body`, async () => {
    // arrange
    mockFetchWithResponse(200, '{ "foo": { "bar": 42f } }')

    // act
    const query = requestJson(sampleTestDataQuery).catch(fetchErrorHandler(logger))

    // assert
    await expect(query).rejects.toThrow(FirebaseError)
    await expect(query).rejects.toThrow(new FirebaseError('SERVER_ERROR'))
    expect(logger.lines).toEqual([
      `[ERROR] Validation Error: Unexpected token f in JSON at position 20`, //
      `[ERROR]          Request: ${expectedRequestLog}`,
      `[ERROR]         Response: 200 OK`,
      `[ERROR]    Response-Body: { "foo": { "bar": 42f } }`,
    ])
  })

  it(`should throw server FirebaseError for server ok response but json body with invalid data`, async () => {
    // arrange
    mockFetchWithResponse(200, JSON.stringify({ foo: 'X', bar: 'I am not a number' }))

    // act
    const query = requestJson(sampleTestDataQuery).catch(fetchErrorHandler(logger))

    // assert
    await expect(query).rejects.toThrow(FirebaseError)
    await expect(query).rejects.toThrow(new FirebaseError('SERVER_ERROR'))
    expect(logger.lines).toEqual([
      `[ERROR] Validation Error: At path: bar -- Expected a number, but received: "I am not a number"`, //
      `[ERROR]          Request: ${expectedRequestLog}`,
      `[ERROR]         Response: 200 OK`,
      `[ERROR]    Response-Body: { foo: X, bar: I am not a number }`,
    ])
  })
})
