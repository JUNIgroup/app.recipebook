/* eslint-disable max-classes-per-file */

export class DBError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DBError'
  }
}

export class AbortError extends DBError {
  constructor(message = 'Transaction aborted') {
    super(message)
    this.name = 'AbortError'
  }
}

export class ObjectNotFound extends DBError {
  constructor(public storeName: string, public id: string, message?: string) {
    super(message ?? `Object with id ${id} not found in store ${storeName}`)
    this.name = 'ObjectNotFound'
  }
}
