/**
 * Thrown when a transaction is aborted.
 */
export class AbortError extends Error {
  constructor(message = 'Transaction aborted') {
    super(message)
    this.name = this.constructor.name
  }
}
