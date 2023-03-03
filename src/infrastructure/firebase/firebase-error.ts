/**
 * Common error codes for returned by the Firebase REST API.
 */
export type FirebaseErrorCode =
  | 'EMAIL_EXISTS'
  | 'EMAIL_NOT_FOUND'
  | 'USER_DISABLED'
  | 'USER_NOT_FOUND'
  | 'INVALID_EMAIL'
  | 'INVALID_PASSWORD'
  | 'WEAK_PASSWORD'
  | 'OPERATION_NOT_ALLOWED'
  | 'INVALID_ID_TOKEN'

export type SyntheticFirebaseErrorCode =
  | 'SERVER_ERROR' // HTTP errors but not Firebase errors
  | 'NETWORK_ERROR' // Network errors
  | 'UNKNOWN_ERROR' // Unknown errors
  | 'NOT_AUTHORIZED' // User not authorized to perform operation

export class FirebaseError extends Error {
  constructor(public errorCode: FirebaseErrorCode | SyntheticFirebaseErrorCode) {
    super(errorCode)
  }
}
