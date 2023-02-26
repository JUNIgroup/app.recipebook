import axios, { AxiosResponse } from 'axios'
import { isEmulatorAvailable } from './emulator-utils'
import { AccountEndpoints, createEmulatorEndpoints, createRemoteEndpoints } from './endpoints'

const accountEndpointNames: (keyof AccountEndpoints)[] = [
  'signUp',
  'signInWithPassword',
  'updateProfile',
  'lookupProfile',
]

describe('createRemoteEndpoints', () => {
  it.each(accountEndpointNames)(
    'should endpoint for "%s" be absolute URI to google identity toolkit',
    async (endpointName) => {
      const endpoints = await createRemoteEndpoints('my-api-key')
      expect(endpoints[endpointName]).toMatch(/^https:\/\/identitytoolkit\.googleapis\.com\/v1\/accounts/)
    },
  )
})

const emulatorAvailable = await isEmulatorAvailable()

describe('createEmulatorEndpoints', () => {
  describe.runIf(emulatorAvailable)('if emulator is available', () => {
    it.each(accountEndpointNames)('should endpoint for "%s" be available', async (endpointName) => {
      const endpoints = await createEmulatorEndpoints()
      const endpoint = endpoints[endpointName]
      const email = 'invalid-email'
      const ping = await axios.post(endpoint, { email }).catch((error) => error.response as AxiosResponse)
      expect(ping.status).toBe(400) // Bad Request but available
    })
  })

  describe.runIf(!emulatorAvailable)('if emulator is not available', () => {
    it('should throw an error', async () => {
      const endpoints = createEmulatorEndpoints()
      await expect(endpoints).rejects.toThrowError('Firebase auth emulator is not running.')
    })
  })
})
