import axios, { AxiosResponse } from 'axios'
import { Logger } from '../../logger/logger'
import { ValidateFunction } from '../../validation'
import { FirebaseError } from '../firebase-error'

/**
 * Extracts the data from the response and validates it.
 *
 * @param logger the logger to use
 * @param validate the validation function to use
 * @returns a function that extracts the data from the response and validates it.
 */
export function extractResponseData<T>(
  logger: Logger,
  validate: ValidateFunction<T>,
): (response: AxiosResponse<T>) => T {
  return (response: AxiosResponse<T>) => {
    if (validate(response.data)) return response.data

    const { method = 'GET', url, headers, data: requestData } = response.config
    logger.error('Validation Error: Invalid response data: %o', response.data)
    logger.error(`         Request: %s %s, data: %o, headers: %o`, method.toUpperCase(), url, requestData, headers)
    validate.errors?.forEach((error) => {
      logger.error(`         Problem: @%s %s`, error.instancePath, error.message)
    })
    throw new FirebaseError('SERVER_ERROR')
  }
}

/**
 * Converts an axios error into a FirebaseError.
 *
 * @param logger the logger to use
 * @returns a function that converts an axios error into a FirebaseError.
 */
export function requestErrorHandler(logger: Logger): (error: unknown) => never {
  return (error) => {
    if (error instanceof FirebaseError) throw error

    if (!axios.isAxiosError(error) || !error.config) {
      logger.error('Unknown Error: %s', error instanceof Error ? error.message : error)
      throw new FirebaseError('UNKNOWN_ERROR')
    }
    const { method = 'GET', url, headers, data: requestData } = error.config

    if (!error.response) {
      logger.error('Network Error: %s / %s', error.code, error.message)
      logger.error(`      Request: %s %s, headers: %o`, method.toUpperCase(), url, headers)
      throw new FirebaseError('NETWORK_ERROR')
    }
    const { status, statusText, data: responseData } = error.response

    if (status !== 400) {
      logger.error('Server Error: %s / %s', error.code, error.message)
      logger.error(`     Request: %s %s, headers: %o`, method.toUpperCase(), url, headers)
      logger.error(`    Response: %d %s`, status, statusText)
      throw new FirebaseError('SERVER_ERROR')
    }

    const errorCode = responseData?.error?.message ?? 'SERVER_ERROR'
    logger.error('Firebase Error: %s / %s', error.code, error.message)
    logger.error(`       Request: %s %s, data: %o, headers: %o`, method.toUpperCase(), url, requestData, headers)
    logger.error(`      Response: %s`, errorCode)
    throw new FirebaseError(errorCode)
  }
}
