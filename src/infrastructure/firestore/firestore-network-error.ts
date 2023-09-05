import { FirestoreRestError } from './firestore-rest-error'

/**
 * A error thrown by the FirestoreRestService, if the network request was aborted or failed.
 */
export class FirestoreNetworkError extends FirestoreRestError {
  constructor(
    message: string,
    public readonly aborted: boolean,
  ) {
    super(message)
    this.name = 'FirestoreNetworkError'
  }
}
