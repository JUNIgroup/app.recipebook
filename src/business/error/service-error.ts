/**
 * An error thrown by a service.
 */
export class ServiceError extends Error {
  /**
   * @param service the name of the service
   * @param plainMessage the error message
   * @param options additional error options
   */
  constructor(public readonly service: string, public readonly plainMessage: string, options?: ErrorOptions) {
    super(`[${service}] ${plainMessage}`, options)
  }
}

/**
 * The DTO representation of a ServiceError.
 *
 * Allows to store the error in a redux store.
 */
export type ServiceErrorDto<T extends ServiceError = ServiceError> = {
  +readonly [key in keyof Omit<T, 'stack' | 'cause'>]: T[key] extends string | number | boolean | undefined
    ? T[key]
    : never
}

/**
 * Converts an ServiceError class instance to a ServiceErrorDto.
 *
 * It retains all keys in root level, which value is a primitive (string, number, boolean),
 * except the keys `stack` and `cause`.
 */
export function toServiceErrorDto<T extends ServiceError>(error: T): ServiceErrorDto<T> {
  const pass = ([key, value]: [string, unknown]) =>
    !['stack', 'cause'].includes(key) && ['string', 'boolean', 'number'].includes(typeof value)
  return Object.fromEntries(Object.entries(error).filter(pass)) as ServiceErrorDto<T>
}
