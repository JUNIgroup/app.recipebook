import { FirebaseError } from 'firebase/app'
import { AuthErrorCodes as FirebaseAuthErrorCodes, User } from 'firebase/auth'
import { AuthError, AuthErrorCode, UserData } from './auth-service'

type FirebaseErrorCode = typeof FirebaseAuthErrorCodes[keyof typeof FirebaseAuthErrorCodes] | 'auth/missing-email'

const errorCodeMap: Partial<Record<FirebaseErrorCode, AuthErrorCode>> = {
  'auth/credential-already-in-use': 'auth/user-already-exist',
  'auth/email-already-in-use': 'auth/user-already-exist',
  'auth/invalid-verification-code': 'auth/invalid-credential',
  'auth/missing-email': 'auth/invalid-credential',
  'auth/invalid-email': 'auth/invalid-credential',
  'auth/wrong-password': 'auth/invalid-credential',
  'auth/too-many-requests': 'auth/too-many-tries',
  'auth/user-cancelled': 'auth/invalid-credential',
  'auth/user-not-found': 'auth/user-not-found',
  'auth/user-disabled': 'auth/user-not-found',
  'auth/weak-password': 'auth/invalid-credential',
}

/** Convert an error, especially FirebaseError to an general AuthError. */
export function toAuthError(serviceName: string, error: unknown): AuthError {
  if (error instanceof FirebaseError) {
    const authErrorCode = errorCodeMap[error.code as FirebaseErrorCode] ?? 'auth/service-not-available'
    return new AuthError(serviceName, authErrorCode, error.message, { cause: error })
  }

  return new AuthError(serviceName, 'auth/service-not-available', 'internal error', { cause: error })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function at(data: any, field: string): number | undefined {
  const time = +data[field]
  return Number.isSafeInteger(time) ? time : undefined
}

/** convert the Firebase User object ot a general UserData object. */
export function toUserData(user: User, displayName?: string): UserData {
  return {
    id: user.uid,
    name: displayName || user.displayName || user.email || '',
    email: user.email ?? undefined,
    verified: user.emailVerified,
    createdAt: at(user.metadata, 'createdAt'),
    lastLoginAt: at(user.metadata, 'lastLoginAt'),
  }
}
