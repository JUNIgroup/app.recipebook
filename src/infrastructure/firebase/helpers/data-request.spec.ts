import { AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { boolean, number, object, optional, string } from 'superstruct'
import { FakeLogger } from '../../logger/fake-logger.test-helper'
import { Logger } from '../../logger/logger'
import { createValidationFunction } from '../../validation/superstruct.extend'
import { FirebaseError } from '../firebase-error'
import { extractResponseData, requestErrorHandler } from './data-request'

describe('requestErrorHandler', () => {
  const requestHeaders = new AxiosHeaders({ Accept: 'application/json, text/plain, */*' })
  const config: InternalAxiosRequestConfig = {
    method: 'get',
    url: 'http://localhost:8080',
    data: { pay: 'load' },
    headers: requestHeaders,
  }

  it('should return a handler function', () => {
    const logger = { error: () => {} } as Logger
    const handler = requestErrorHandler(logger)
    expect(handler).toBeInstanceOf(Function)
  })

  describe('the returned error handler', () => {
    it('should rethrow FirebaseError', () => {
      const logger = new FakeLogger()
      const handler = requestErrorHandler(logger)
      const error = new FirebaseError('EMAIL_NOT_FOUND')
      expect(() => handler(error)).toThrow(error)
      expect(logger.output).not.toHaveBeenCalled()
    })

    it('should throw unknown FirebaseError for non-error', () => {
      const logger = new FakeLogger()
      const handler = requestErrorHandler(logger)
      const error = 'error text only'
      expect(() => handler(error)).toThrow(new FirebaseError('UNKNOWN_ERROR'))
      expect(logger.output).toHaveBeenCalledWith('[ERROR] Unknown Error: error text only')
    })

    it('should throw unknown FirebaseError for non axios-error', () => {
      const logger = new FakeLogger()
      const handler = requestErrorHandler(logger)
      const error = new Error('error but not axios error')
      expect(() => handler(error)).toThrow(new FirebaseError('UNKNOWN_ERROR'))
      expect(logger.output).toHaveBeenCalledWith('[ERROR] Unknown Error: error but not axios error')
    })

    it('should throw unknown FirebaseError for axios-error without config', () => {
      const logger = new FakeLogger()
      const handler = requestErrorHandler(logger)
      const error = new AxiosError('axios error without config')
      expect(() => handler(error)).toThrow(new FirebaseError('UNKNOWN_ERROR'))
      expect(logger.output).toHaveBeenCalledWith('[ERROR] Unknown Error: axios error without config')
    })

    it('should throw network FirebaseError for axios-error without response', () => {
      const logger = new FakeLogger()
      const handler = requestErrorHandler(logger)
      const error = new AxiosError(
        'axios error without response', // message
        'ERR_NETWORK', // code
        config,
        undefined, // request ... ignored
        undefined, // response
      )
      const headers = '{ Accept: application/json, text/plain, */* }'

      expect(() => handler(error)).toThrow(new FirebaseError('NETWORK_ERROR'))
      expect(logger.lines).toEqual([
        '[ERROR] Network Error: ERR_NETWORK / axios error without response',
        `[ERROR]       Request: GET http://localhost:8080, headers: ${headers}`,
      ])
    })

    it('should throw server FirebaseError for with response and status !== 400', () => {
      const logger = new FakeLogger()
      const handler = requestErrorHandler(logger)
      const error = new AxiosError(
        'Request failed with status code 404', // message
        'ERR_BAD_REQUEST', // code
        config,
        undefined, // request ... ignored
        { status: 404, statusText: 'Not Found', data: '<html>...</html>' } as AxiosResponse,
      )
      const headers = '{ Accept: application/json, text/plain, */* }'

      expect(() => handler(error)).toThrow(new FirebaseError('SERVER_ERROR'))
      expect(logger.lines).toEqual([
        '[ERROR] Server Error: ERR_BAD_REQUEST / Request failed with status code 404',
        `[ERROR]      Request: GET http://localhost:8080, headers: ${headers}`,
        `[ERROR]     Response: 404 Not Found`,
      ])
    })

    it('should throw firebase FirebaseError EMAIL_NOT_FOUND', () => {
      const logger = new FakeLogger()
      const handler = requestErrorHandler(logger)
      const firebaseError = { error: { message: 'EMAIL_NOT_FOUND' } }
      const error = new AxiosError(
        'Request failed with status code 400', // message
        'ERR_BAD_REQUEST', // code
        config,
        undefined, // request ... ignored
        { status: 400, statusText: 'Not Found', data: firebaseError } as AxiosResponse,
      )
      const headers = '{ Accept: application/json, text/plain, */* }'

      expect(() => handler(error)).toThrow(new FirebaseError('EMAIL_NOT_FOUND'))
      expect(logger.lines).toEqual([
        '[ERROR] Firebase Error: ERR_BAD_REQUEST / Request failed with status code 400',
        `[ERROR]        Request: GET http://localhost:8080, data: { pay: load }, headers: ${headers}`,
        `[ERROR]       Response: EMAIL_NOT_FOUND`,
      ])
    })
  })
})

describe('extractResponseData', () => {
  const requestHeaders = new AxiosHeaders({ Accept: 'application/json, text/plain, */*' })
  const config: InternalAxiosRequestConfig = {
    method: 'get',
    url: 'http://localhost:8080',
    data: { pay: 'load' },
    headers: requestHeaders,
  }

  const validate = createValidationFunction(
    object({
      foo: string(),
      bar: number(),
      baz: optional(boolean()),
    }),
  )

  it('should return a handler function', () => {
    const logger = new FakeLogger()
    const handler = extractResponseData(logger, validate)

    expect(handler).toBeInstanceOf(Function)
  })

  it('should extract valid data from response', () => {
    const payload = { foo: 'foo', bar: 1, baz: true }
    const logger = new FakeLogger(true)
    const response = { config, data: payload } as AxiosResponse
    const handler = extractResponseData(logger, validate)
    const data = handler(response)

    expect(data).toEqual({ foo: 'foo', bar: 1, baz: true })
  })

  it('should throw server error if payload is invalid', () => {
    const payload = { foo: 123, baz: 'string?' }
    const logger = new FakeLogger(true)
    const response = { config, data: payload } as AxiosResponse
    const handler = extractResponseData(logger, validate)
    const headers = '{ Accept: application/json, text/plain, */* }'

    expect(() => handler(response)).toThrow(new FirebaseError('SERVER_ERROR'))
    expect(logger.lines).toEqual([
      '[ERROR] Validation Error: Invalid response data: { foo: 123, baz: string? }',
      `[ERROR]          Request: GET http://localhost:8080, data: { pay: load }, headers: ${headers}`,
      `[ERROR]          Problem: At path: foo -- Expected a string, but received: 123`,
    ])
  })
})
