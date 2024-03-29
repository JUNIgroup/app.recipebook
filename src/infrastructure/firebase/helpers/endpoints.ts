import { isEmulatorAvailable } from '../../../utilities/firebase/emulator-utils'

export interface AccountEndpoints {
  signUpWithPassword: string
  signInWithPassword: string
  updateProfile: string
  lookupProfile: string
  deleteAccount: string
}

function createEndpoints(accountEndpoint: string, apiKey: string): AccountEndpoints {
  const endpoints: AccountEndpoints = {
    signUpWithPassword: `${accountEndpoint}:signUp?key=${apiKey}`,
    signInWithPassword: `${accountEndpoint}:signInWithPassword?key=${apiKey}`,
    updateProfile: `${accountEndpoint}:update?key=${apiKey}`,
    lookupProfile: `${accountEndpoint}:lookup?key=${apiKey}`,
    deleteAccount: `${accountEndpoint}:delete?key=${apiKey}`,
  }
  return endpoints
}

/**
 * Returns the endpoints for the firebase auth service.
 *
 * @param apiKey the api key for the firebase project
 * @returns the endpoints for the firebase auth service
 */
export async function createRemoteEndpoints(apiKey: string): Promise<AccountEndpoints> {
  const accountEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts`
  return createEndpoints(accountEndpoint, apiKey)
}

/**
 * Returns the endpoints for the firebase auth emulator.
 * @returns
 */
export async function createEmulatorEndpoints(): Promise<AccountEndpoints> {
  const info = await isEmulatorAvailable()
  if (!info || !info.auth) {
    throw new Error('Firebase auth emulator is not running.')
  }
  const accountEndpoint = `http://${info.auth.host}:${info.auth.port}/identitytoolkit.googleapis.com/v1/accounts`
  const apiKey = 'fake-api-key'
  return createEndpoints(accountEndpoint, apiKey)
}
