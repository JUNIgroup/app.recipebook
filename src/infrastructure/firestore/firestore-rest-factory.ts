import { FirestoreService } from '../../business/recipe-books/database/firestore/firestore-service.api'
import { isEmulatorAvailable } from '../../utilities/firebase/emulator-utils'
import { Logger } from '../../utilities/logger'
import { FirestoreOptions, FirestoreRestService } from './firestore-rest-service'

export function createFirestoreRestServiceForRemote(
  logger: Logger<'infra'>,
  options: Omit<FirestoreOptions, 'apiEndpoint'>,
): FirestoreService {
  return new FirestoreRestService(logger, {
    ...options,
    apiEndpoint: 'https://firestore.googleapis.com/v1',
  })
}

export function createFirestoreRestServiceForEmulator(
  logger: Logger<'infra'>,
  options: Omit<FirestoreOptions, 'apiEndpoint'>,
): FirestoreService {
  return new FirestoreRestService(logger, {
    ...options,
    // apiEndpoint: 'http://localhost:9098/v1',
    apiEndpoint: createEmulatorEndpoint(),
  })
}

async function createEmulatorEndpoint(): Promise<string> {
  const info = await isEmulatorAvailable()
  if (!info || !info.firestore) {
    throw new Error('Firebase firestore emulator is not running.')
  }
  return `http://${info.firestore.host}:${info.firestore.port}/v1`
}
