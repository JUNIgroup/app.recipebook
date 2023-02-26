import type { ValidateFunction } from '../../validation'
import { validate as validateSetAccountInfoResponse } from './schemas/set-account-info-response.json-schema'
import { validate as validateSignupNewUserResponse } from './schemas/signup-new-user-response.json-schema'
import { validate as validateVerifyPasswordResponse } from './schemas/verify-password-response.json-schema'
import { validate as validateGetAccountInfoResponse } from './schemas/get-account-info-response.json-schema'
import { validate as validateAuthData } from './schemas/auth-data.json-schema'

export interface AuthUser {
  id: string
  email: string
  displayName: string | undefined
  verified: boolean
  createdAt: number
  lastLoginAt: number
}

export interface AuthToken {
  secureToken: string
  refreshToken: string
  expiresAt: number
}

export interface AuthData {
  user: AuthUser
  token: AuthToken
}

export const isAuthData = validateAuthData as ValidateFunction<AuthData>

export interface SignupNewUserResponse {
  kind: 'identitytoolkit#SignupNewUserResponse'
  localId: string
  email: string
  idToken: string
  refreshToken: string
  expiresIn: `${number}`
}

export const isSignupNewUserResponse = validateSignupNewUserResponse as ValidateFunction<SignupNewUserResponse>

export interface VerifyPasswordResponse {
  kind: 'identitytoolkit#VerifyPasswordResponse'
  localId: string
  email: string
  idToken: string
  refreshToken: string
  expiresIn: `${number}`
  registered: boolean
}

export const isVerifyPasswordResponse = validateVerifyPasswordResponse as ValidateFunction<VerifyPasswordResponse>

export interface ProfileUpdateParams {
  displayName?: string
}

export interface SetAccountInfoResponse {
  kind: 'identitytoolkit#SetAccountInfoResponse'
  localId: string
  email: string
  displayName?: string
  photoUrl?: string
}

export const isSetAccountInfoResponse = validateSetAccountInfoResponse as ValidateFunction<SetAccountInfoResponse>

export interface GetAccountInfoResponse {
  kind: 'identitytoolkit#GetAccountInfoResponse'
  users: {
    localId: string
    email: string
    emailVerified: boolean
    displayName: string
    photoUrl: string
    createdAt: string
    lastLoginAt: string
  }[]
}

export const isGetAccountInfoResponse = validateGetAccountInfoResponse as ValidateFunction<GetAccountInfoResponse>

export interface ChangePasswordParams {
  email: string
  password: string
  newPassword: string
}

export interface ChangeEmailParams {
  email: string
  newEmail: string
  password: string
}
