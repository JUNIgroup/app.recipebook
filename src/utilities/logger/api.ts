export interface Log {
  /**
   * True if the log should log info and details messages.
   *
   * The warning and error messages are always logged.
   */
  readonly enabled: boolean
  /**
   * Logs a main info messages.
   *
   * The message does not support placeholders. But you can pass additional data to log or use inline objects.
   *
   * @example
   * log.info(`Hello world!`)
   * log.info(`Hello ${what}!`)
   * log.info(`Hello `, `world`, `!`)
   *
   * @param message the message to log
   * @param more additional data to log
   */
  info(message: string, ...more: unknown[]): void

  /**
   * Logs more verbose info messages.
   *
   * The message does not support placeholders. But you can pass additional data to log or use inline objects.
   *
   * @example
   * log.details(`request started`)
   * log.details(`request started: url=${url}`)
   * log.details(`request started`, { url: 'http://localhost:3000' })
   *
   * @param message the message to log
   * @param more additional data to log
   */
  details(message: string, ...more: unknown[]): void

  /**
   * Logs a warning message.
   *
   * The message does not support placeholders. But you can pass additional data to log or use inline objects.
   *
   * @example
   * log.warn(`Something is wrong!`)
   * log.warn(`Something is wrong: ${what}`)
   * log.warn(`Something is wrong`, { what: 'the world' })
   *
   * @param message the message to log
   * @param more additional data to log
   */
  warn(message: string, ...more: unknown[]): void

  /**
   * Logs an error message.
   *
   * The message does not support placeholders. But you can pass additional data to log or use inline objects.
   *
   * @example
   * log.error(`Something went wrong!`)
   * log.error(`Something went wrong: ${what}`)
   * log.error(`Something went wrong`, { what: 'the world' })
   *
   * @param message the message to log
   * @param more additional data to log
   */
  error(message: string, ...more: unknown[]): void
}

/**
 * Gets a Log instance for the given namespace.
 */
export interface Logger<Namespace extends string = string> {
  /**
   * Gets a Log instance for the given namespace.
   *
   * @param namespace the namespace to get the logger for
   */
  (namespace: Namespace): Log
}
