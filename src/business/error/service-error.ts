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
