import { defineGlobalFetchForTesting } from '../query/fetch.test-helper'
import { isEmulatorAvailable } from './emulator-utils'

defineGlobalFetchForTesting()

const emulatorIsAvailable = await isEmulatorAvailable()

describe.runIf(emulatorIsAvailable)('if emulator is available', () => {
  it('should have access to hub', async () => {
    const hub = emulatorIsAvailable?.hub
    expect(hub).toBeTruthy()
    const { host, port } = hub ?? {}
    const ping = fetch(`http://${host}:${port}`, { method: 'GET' })
    await expect(ping).resolves.toBeTruthy()
  })

  it.runIf(emulatorIsAvailable?.ui)('should have access to UI', async () => {
    const ui = emulatorIsAvailable?.ui
    const { host, port } = ui ?? {}
    const ping = fetch(`http://${host}:${port}`, { method: 'GET' })
    await expect(ping).resolves.toBeTruthy()
  })

  it('should have access to auth', async () => {
    const auth = emulatorIsAvailable?.auth
    expect(auth).toBeTruthy()
    const { host, port } = auth ?? {}
    const ping = fetch(`http://${host}:${port}`, { method: 'GET' })
    await expect(ping).resolves.toBeTruthy()
  })
})

describe.runIf(!emulatorIsAvailable)('if emulator is not available', () => {
  it('should be null', () => {
    expect(emulatorIsAvailable).toBe(null)
  })
})
