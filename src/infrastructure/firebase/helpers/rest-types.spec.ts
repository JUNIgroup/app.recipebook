import { StructError } from 'superstruct'
import {
  assertAuthData,
  assertDeleteAccountResponse,
  assertGetAccountInfoResponse,
  assertSetAccountInfoResponse,
  assertSignupNewUserResponse,
  assertVerifyPasswordResponse,
  AuthData,
  AuthToken,
  AuthUser,
  DeleteAccountResponse,
  GetAccountInfoResponse,
  SetAccountInfoResponse,
  SignupNewUserResponse,
  VerifyPasswordResponse,
} from './rest-types'

describe('assertAuthData', () => {
  it('should not throw exception for a valid response', () => {
    // arrange
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

    // act
    const act = () => assertAuthData(data)

    // assert
    expect(act).not.toThrowError()
  })

  it('should throw StructError for an invalid response', () => {
    // arrange
    const data = { kind: 'something else' }

    // act
    const act = () => assertAuthData(data)

    // assert
    expect(act).toThrowError(StructError)
  })
})

describe('assertSignupNewUserResponse', () => {
  it('should not throw exception for a valid response', () => {
    // arrange
    const response: SignupNewUserResponse = {
      kind: 'identitytoolkit#SignupNewUserResponse',
      localId: 'localId',
      email: 'email',
      idToken: 'idToken',
      refreshToken: 'refreshToken',
      expiresIn: '3600',
    }

    // act
    const act = () => assertSignupNewUserResponse(response)

    // assert
    expect(act).not.toThrowError()
  })

  it('should throw StructError for an invalid response', () => {
    // arrange
    const response = { kind: 'something else' }

    // act
    const act = () => assertSignupNewUserResponse(response)

    // assert
    expect(act).toThrowError(StructError)
  })
})

describe('assertVerifyPasswordResponse', () => {
  it('should not throw exception for a valid response', () => {
    // arrange
    const response: VerifyPasswordResponse = {
      kind: 'identitytoolkit#VerifyPasswordResponse',
      localId: 'localId',
      email: 'email',
      idToken: 'idToken',
      refreshToken: 'refreshToken',
      expiresIn: '3600',
      registered: true,
    }

    // act
    const act = () => assertVerifyPasswordResponse(response)

    // assert
    expect(act).not.toThrowError()
  })

  it('should throw StructError for an invalid response', () => {
    // arrange
    const response = { kind: 'something else' }

    // act
    const act = () => assertVerifyPasswordResponse(response)

    // assert
    expect(act).toThrowError(StructError)
  })
})

describe('assertSetAccountInfoResponse', () => {
  it('should not throw exception for a valid response', () => {
    // arrange
    const response: SetAccountInfoResponse = {
      kind: 'identitytoolkit#SetAccountInfoResponse',
      localId: 'localId',
      email: 'email',
      displayName: 'displayName',
      photoUrl: 'photoUrl',
    }

    // act
    const act = () => assertSetAccountInfoResponse(response)

    // assert
    expect(act).not.toThrowError()
  })

  it('should throw StructError for an invalid response', () => {
    // arrange
    const response = { kind: 'something else' }

    // act
    const act = () => assertSetAccountInfoResponse(response)

    // assert
    expect(act).toThrowError(StructError)
  })
})

describe('assertGetAccountInfoResponse', () => {
  it('should not throw exception for a valid response', () => {
    // arrange
    const response: GetAccountInfoResponse = {
      kind: 'identitytoolkit#GetAccountInfoResponse',
      users: [
        {
          localId: 'localId',
          email: 'email',
          emailVerified: false,
          displayName: 'displayName',
          photoUrl: 'photoUrl',
          createdAt: '1234',
          lastLoginAt: '1234',
        },
      ],
    }

    // act
    const act = () => assertGetAccountInfoResponse(response)

    // assert
    expect(act).not.toThrowError()
  })

  it('should throw StructError for an invalid response', () => {
    // arrange
    const response = { kind: 'something else' }

    // act
    const act = () => assertGetAccountInfoResponse(response)

    // assert
    expect(act).toThrowError(StructError)
  })
})

describe('assertDeleteAccountResponse', () => {
  it('should not throw exception for a valid response', () => {
    // arrange
    const response: DeleteAccountResponse = {
      kind: 'identitytoolkit#DeleteAccountResponse',
    }

    // act
    const act = () => assertDeleteAccountResponse(response)

    // assert
    expect(act).not.toThrowError()
  })

  it('should throw StructError for an invalid response', () => {
    // arrange
    const response = { kind: 'something else' }

    // act
    const act = () => assertDeleteAccountResponse(response)

    // assert
    expect(act).toThrowError(StructError)
  })
})
