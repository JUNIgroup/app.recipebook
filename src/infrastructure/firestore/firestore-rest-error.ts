/**
 * A error thrown by the FirestoreRestService.
 */
export class FirestoreRestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FirestoreRestError'
  }
}
