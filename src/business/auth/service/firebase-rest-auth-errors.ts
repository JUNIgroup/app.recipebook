import {
  FirebaseError,
  FirebaseErrorCode,
  SyntheticFirebaseErrorCode,
} from '../../../infrastructure/firebase/firebase-error'
import { AuthError, AuthErrorCode } from './auth-service'

const errorCodeMap: Partial<Record<FirebaseErrorCode | SyntheticFirebaseErrorCode, AuthErrorCode>> = {
  EMAIL_EXISTS: 'auth/user-already-exist',
  EMAIL_NOT_FOUND: 'auth/user-not-found',
  USER_DISABLED: 'auth/user-not-found',
  USER_NOT_FOUND: 'auth/user-not-found',
  INVALID_EMAIL: 'auth/invalid-credential',
  INVALID_PASSWORD: 'auth/invalid-credential',
  WEAK_PASSWORD: 'auth/invalid-credential',
  INVALID_ID_TOKEN: 'auth/invalid-credential',
  NOT_AUTHORIZED: 'auth/invalid-credential',
}

const defaultErrorCode: AuthErrorCode = 'auth/service-not-available'

const serviceName = 'FirebaseRestAuthService'

/** Convert an error, especially FirebaseError to an general AuthError. */
export function toAuthError(error: unknown): AuthError {
  if (error instanceof FirebaseError) {
    const authErrorCode = errorCodeMap[error.errorCode] ?? defaultErrorCode
    return new AuthError(serviceName, authErrorCode, error.message, { cause: error })
  }
  return new AuthError(serviceName, defaultErrorCode, 'internal error', { cause: error })
}
