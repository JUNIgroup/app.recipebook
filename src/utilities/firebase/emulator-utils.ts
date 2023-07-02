import { emulators } from '../../../firebase.json'
import { emulatorDefaultPorts } from './emulator-default-ports'

interface EmulatorStatus {
  hub?: { name: string; host: string; port: number }
  ui?: { name: string; host: string; port: number }
  auth?: { name: string; host: string; port: number }
  firestore?: { name: string; host: string; port: number; webSocketHost: string; webSocketPort: number }
}

export async function isEmulatorAvailable(): Promise<null | EmulatorStatus> {
  if (!import.meta.env.VITE_FIREBASE__USE_EMULATOR) return null
  if (!fetch) throw new Error('fetch is not available')

  const host = import.meta.env.VITE_FIREBASE__USE_EMULATOR
  const hubPort = emulators.hub?.port ?? emulatorDefaultPorts.hub
  const endpoint = `http://${host}:${hubPort}/emulators`
  try {
    const response = await fetch(endpoint, { method: 'GET' })
    const { hub, ui, auth, firestore } = await response.json()
    const info: EmulatorStatus = { hub, ui, auth, firestore }
    return info
  } catch (error) {
    return null
  }
}
