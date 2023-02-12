/* eslint-disable max-classes-per-file */
import { OutdatedCause } from './db.types'

/**
 * Base class of all errors thrown by the database.
 */
export class DBError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

/**
 * Thrown when a transaction is aborted.
 */
export class AbortError extends DBError {
  constructor(message = 'Transaction aborted') {
    super(message)
  }
}

export class OutdatedError extends DBError {
  constructor(
    public readonly outdatedObjects: Record<string, OutdatedCause>,
    message = OutdatedError.defaultMessages(outdatedObjects),
  ) {
    super(message)
  }

  private static defaultMessages(outdatedObjects: Record<string, OutdatedCause>) {
    const count = Object.keys(outdatedObjects).length
    return count === 1 ? '1 object is outdated' : `${count} objects are outdated`
  }
}
