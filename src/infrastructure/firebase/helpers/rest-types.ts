import type { ValidateFunction } from '../../validation'
import { validate as validateSetAccountInfoResponse } from './schemas/set-account-info-response.json-schema'
import { validate as validateSignupNewUserResponse } from './schemas/signup-new-user-response.json-schema'
import { validate as validateVerifyPasswordResponse } from './schemas/verify-password-response.json-schema'
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

export interface SignUpParams {
  email: string
  password: string
  displayName: string
}

export interface SignUpResponse {
  kind: 'identitytoolkit#SignupNewUserResponse'
  localId: string
  email: string
  idToken: string
  refreshToken: string
  expiresIn: `${number}`
}

export const isSignUpResponse = validateSignupNewUserResponse as ValidateFunction<SignUpResponse>

export interface SignInParams {
  email: string
  password: string
}

export interface SignInResponse {
  kind: 'identitytoolkit#VerifyPasswordResponse'
  localId: string
  email: string
  idToken: string
  refreshToken: string
  expiresIn: `${number}`
  registered: boolean
}

export const isSignInResponse = validateVerifyPasswordResponse as ValidateFunction<SignUpResponse>

export interface ProfileUpdateParams {
  displayName?: string
}

export interface ProfileUpdateResponse {
  kind: 'identitytoolkit#SetAccountInfoResponse'
  localId: string
  email: string
  displayName?: string
  photoUrl?: string
}

export const isProfileUpdateResponse = validateSetAccountInfoResponse as ValidateFunction<ProfileUpdateResponse>

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
