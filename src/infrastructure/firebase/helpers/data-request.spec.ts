import { boolean, Infer, number, object, optional, string } from 'superstruct'
import { FakeLogger } from '../../logger/fake-logger.test-helper'
import { Logger } from '../../logger/logger'
import { defineGlobalFetchForTesting } from '../../query/fetch.test-helper'
import { ValidateFunction } from '../../validation/index'
import { createValidationFunction } from '../../validation/superstruct.extend'
import { FirebaseError } from '../firebase-error'
import { checkStatus, extractFetchData, FetchError, fetchErrorHandler, startQuery } from './data-request'

defineGlobalFetchForTesting()

const abortErrorName = 'AbortError'
const abortErrorMessage = 'The user aborted a request.'

const ValidStruct = object({
  foo: string(),
  bar: number(),
  baz: optional(boolean()),
})

type ValidType = Infer<typeof ValidStruct>

const validate: ValidateFunction<ValidType> = createValidationFunction(ValidStruct)

it('should the AbortError have the name "AbortError', async () => {
  // arrange
  const abortController = new AbortController()
  const act = fetch('http://example.com', {
    signal: abortController.signal,
  })
  abortController.abort()

  // act
  const thrown = await act.then(() => undefined).catch((e) => e as Error)

  // assert
  expect(thrown?.name).toEqual(abortErrorName)
  expect(thrown?.message).toEqual(abortErrorMessage)
})

describe('startQuery', () => {
  it('should return request/response if fetch does not throw an error', async () => {
    // arrange
    const request = new Request('http://localhost:8080', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ pay: 'load' }),
    })
    const response = new Response('', { status: 200 })

    vi.spyOn(global, 'fetch').mockResolvedValue(response)

    // act
    const result = await startQuery('POST', 'http://localhost:8080', { pay: 'load' })

    // assert
    expect(result).toEqual({ request, response })
  })

  it('should return FetchError if fetch throws an abort error', async () => {
    // arrange
    const request = new Request('http://localhost:8080', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ pay: 'load' }),
    })
    const error = new Error(abortErrorMessage)
    error.name = abortErrorName

    vi.spyOn(global, 'fetch').mockRejectedValue(error)

    // act
    const query = startQuery('POST', 'http://localhost:8080', { pay: 'load' })
    const thrown = await query.then(() => undefined).catch((e) => e as FetchError)

    // assert
    expect(thrown).toBeInstanceOf(FetchError)
    expect(thrown?.message).toEqual(abortErrorMessage)
    expect(thrown?.request).toEqual(request)
  })

  it('should return FetchError if fetch throws a type error', async () => {
    // arrange
    const request = new Request('http://localhost:8080', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ pay: 'load' }),
    })
    const error = new TypeError('offline')

    vi.spyOn(global, 'fetch').mockRejectedValue(error)

    // act
    const query = startQuery('POST', 'http://localhost:8080', { pay: 'load' })
    const thrown = await query.then(() => undefined).catch((e) => e as FetchError)

    // assert
    expect(thrown).toBeInstanceOf(FetchError)
    expect(thrown?.message).toEqual('offline')
    expect(thrown?.request).toEqual(request)
  })

  it('should return FetchError if fetch throws an unexpected other error', async () => {
    // arrange
    const request = new Request('http://localhost:8080', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ pay: 'load' }),
    })
    const error = 'something else happened'

    vi.spyOn(global, 'fetch').mockRejectedValue(error)

    // act
    const query = startQuery('POST', 'http://localhost:8080', { pay: 'load' })
    const thrown = await query.then(() => undefined).catch((e) => e as FetchError)

    // assert
    expect(thrown).toBeInstanceOf(FetchError)
    expect(thrown?.message).toEqual('something else happened')
    expect(thrown?.request).toEqual(request)
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
    expect(result.message).toEqual(`Query failed with status ${status} ${statusText}`)
    expect(result.request).toBe(request)
    expect(result.response).toBe(response)
  })
})

describe('extractFetchData', () => {
  it('should return a handler function', () => {
    // act
    const handler = extractFetchData(validate)

    // assert
    expect(handler).toBeInstanceOf(Function)
  })

  it('should extract valid data from response', async () => {
    // arrange
    const payload: ValidType = { foo: 'foo', bar: 1, baz: true }
    const request = new Request('http://localhost:8080')
    const response = new Response(JSON.stringify(payload), { status: 200 })
    const handler = extractFetchData(validate)

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
    const handler = extractFetchData(validate)

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
    const handler = extractFetchData(validate)

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
      const error = new FetchError(abortErrorMessage, request)

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
