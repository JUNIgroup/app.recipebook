import {
  isVerifyPasswordResponse,
  isSignupNewUserResponse,
  VerifyPasswordResponse,
  SignupNewUserResponse,
  SetAccountInfoResponse,
  isSetAccountInfoResponse,
  isAuthData,
  AuthData,
  AuthToken,
  AuthUser,
} from './rest-types'

describe('isAuthData', () => {
  it('should return true for a valid response', () => {
    const user: AuthUser = {
      id: 'id1234',
      email: 'email',
      displayName: 'displayName',
      verified: false,
      createdAt: 1234,
      lastLoginAt: 1234,
    }
    const token: AuthToken = {
      secureToken: 'secureToken',
      refreshToken: 'refreshToken',
      expiresAt: 1000,
    }
    const data: AuthData = { user, token }
    const result = isAuthData(data)
    expect(result).toBe(true)
  })

  it('should return false for an invalid response', () => {
    const data = { kind: 'something else' }
    const result = isAuthData(data)
    expect(result).toBe(false)
  })
})

describe('isSignUpResponse', () => {
  it('should return true for a valid response', () => {
    const response: SignupNewUserResponse = {
      kind: 'identitytoolkit#SignupNewUserResponse',
      localId: 'localId',
      email: 'email',
      idToken: 'idToken',
      refreshToken: 'refreshToken',
      expiresIn: '3600',
    }
    const result = isSignupNewUserResponse(response)
    expect(result).toBe(true)
  })

  it('should return false for an invalid response', () => {
    const response = { kind: 'something else' }
    const result = isSignupNewUserResponse(response)
    expect(result).toBe(false)
  })
})

describe('isSignInResponse', () => {
  it('should return true for a valid response', () => {
    const response: VerifyPasswordResponse = {
      kind: 'identitytoolkit#VerifyPasswordResponse',
      localId: 'localId',
      email: 'email',
      idToken: 'idToken',
      refreshToken: 'refreshToken',
      expiresIn: '3600',
      registered: true,
    }
    const result = isVerifyPasswordResponse(response)
    expect(result).toBe(true)
  })

  it('should return false for an invalid response', () => {
    const response = { kind: 'something else' }
    const result = isVerifyPasswordResponse(response)
    expect(result).toBe(false)
  })
})

describe('isProfileUpdateResponse', () => {
  it('should return true for a valid response', () => {
    const response: SetAccountInfoResponse = {
      kind: 'identitytoolkit#SetAccountInfoResponse',
      localId: 'localId',
      email: 'email',
      displayName: 'displayName',
      photoUrl: 'photoUrl',
    }
    const result = isSetAccountInfoResponse(response)
    expect(result).toBe(true)
  })

  it('should return false for an invalid response', () => {
    const response = { kind: 'something else' }
    const result = isSetAccountInfoResponse(response)
    expect(result).toBe(false)
  })
})
