import { array, boolean, Infer, literal, nonempty, number, object, optional, string, type } from 'superstruct'
import { ValidateFunction } from '../../validation/index'
import { createValidationFunction, positiveIntegerString } from '../../validation/superstruct.extend'

/**
 * Superstruct schema for AuthUser
 */
const AuthUserStruct = object({
  id: nonempty(string()),
  email: nonempty(string()),
  displayName: optional(nonempty(string())),
  verified: boolean(),
  createdAt: number(),
  lastLoginAt: number(),
})

export type AuthUser = Infer<typeof AuthUserStruct>

/**
 * Superstruct schema for AuthToken
 */
const AuthTokenStruct = object({
  secureToken: nonempty(string()),
  refreshToken: nonempty(string()),
  expiresAt: number(),
})

export type AuthToken = Infer<typeof AuthTokenStruct>

const AuthDataStruct = object({
  user: AuthUserStruct,
  token: AuthTokenStruct,
})

/**
 * Superstruct schema for AuthData
 */
export type AuthData = Infer<typeof AuthDataStruct>

export const assertAuthData: ValidateFunction<AuthData> = createValidationFunction(AuthDataStruct)

/**
 * Superstruct schema for SignupNewUserResponse
 */
export const SignupNewUserResponseStruct = type({
  kind: literal('identitytoolkit#SignupNewUserResponse'),
  localId: nonempty(string()),
  email: nonempty(string()),
  idToken: nonempty(string()),
  refreshToken: nonempty(string()),
  expiresIn: positiveIntegerString,
})

/**
 * Type for SignupNewUserResponse of googles identity toolkit API.
 */
export type SignupNewUserResponse = Infer<typeof SignupNewUserResponseStruct>

export const assertSignupNewUserResponse = createValidationFunction(SignupNewUserResponseStruct)

/**
 * Superstruct schema for VerifyPasswordResponse
 */
const VerifyPasswordResponseStruct = type({
  kind: literal('identitytoolkit#VerifyPasswordResponse'),
  localId: nonempty(string()),
  email: nonempty(string()),
  idToken: nonempty(string()),
  refreshToken: nonempty(string()),
  expiresIn: positiveIntegerString,
  registered: optional(boolean()),
})

/**
 * Type for VerifyPasswordResponse of googles identity toolkit API.
 */
export type VerifyPasswordResponse = Infer<typeof VerifyPasswordResponseStruct>

export const assertVerifyPasswordResponse = createValidationFunction(VerifyPasswordResponseStruct)

/**
 * Optional values of the user profile to update.
 */
export interface ProfileUpdateParams {
  email?: string
  displayName?: string
  password?: string
}

/**
 * Superstruct schema for SetAccountInfoResponse
 */
const SetAccountInfoResponseStruct = type({
  kind: literal('identitytoolkit#SetAccountInfoResponse'),
  localId: nonempty(string()),
  email: nonempty(string()),
  displayName: optional(nonempty(string())),
  photoUrl: optional(nonempty(string())),
})

/**
 * Type for SetAccountInfoResponse of googles identity toolkit API.
 */
export type SetAccountInfoResponse = Infer<typeof SetAccountInfoResponseStruct>

export const assertSetAccountInfoResponse = createValidationFunction(SetAccountInfoResponseStruct)

/**
 * Superstruct schema for GetAccountInfoResponse
 */
const GetAccountInfoResponseStruct = type({
  kind: literal('identitytoolkit#GetAccountInfoResponse'),
  users: array(
    type({
      localId: nonempty(string()),
      email: nonempty(string()),
      emailVerified: boolean(),
      displayName: optional(nonempty(string())),
      photoUrl: optional(nonempty(string())),
      createdAt: positiveIntegerString,
      lastLoginAt: positiveIntegerString,
    }),
  ),
})

/**
 * Type for GetAccountInfoResponse of googles identity toolkit API.
 */
export type GetAccountInfoResponse = Infer<typeof GetAccountInfoResponseStruct>

export const assertGetAccountInfoResponse = createValidationFunction(GetAccountInfoResponseStruct)

/**
 * Superstruct schema for DeleteAccountResponse
 */
const DeleteAccountResponseStruct = type({
  kind: literal('identitytoolkit#DeleteAccountResponse'),
})

/**
 * Type for DeleteAccountResponse of googles identity toolkit API.
 */
export type DeleteAccountResponse = Infer<typeof DeleteAccountResponseStruct>

export const assertDeleteAccountResponse = createValidationFunction(DeleteAccountResponseStruct)
