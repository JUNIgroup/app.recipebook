import 'solid-devtools'

import { render } from 'solid-js/web'
import { STORAGE_KEY_USER, STORAGE_KEY_EMAIL } from './app.constants'
import { AuthContextProvider } from './business/auth'
import { FirebaseRestAuthService } from './business/auth/service/firebase-rest-auth-service'
import { FirestoreDatabase } from './business/database/firestore/firestore-database'
import { FirestoreService } from './business/database/firestore/firestore-service.api'
import { IdbCacheDatabase } from './business/database/idb-cache/idb-cache-database'
import { memoryPersistence, storagePersistence } from './infrastructure/firebase/persistence'
import { RestAuthService } from './infrastructure/firebase/rest-auth-service'
import {
  createFirestoreRestServiceForEmulator,
  createFirestoreRestServiceForRemote,
} from './infrastructure/firestore/firestore-rest-factory'
import { App } from './presentation/app'
import { createConsoleLogger, createDebugObserver } from './utilities/logger'

import './main.scss'
import { RecipeBooksContextProvider } from './business/recipe-books/context/recipe-books-context'

type LogScope = 'app' | 'utils' | 'infra' | 'business' | 'ui'

const logger = createConsoleLogger<LogScope>()
createDebugObserver(logger.enableLogs.bind(logger))

if (import.meta.env.DEV) {
  logger('app:main').warn('Running in development mode')
}

const storage = localStorage

const restAuthService = import.meta.env.VITE_FIREBASE__USE_EMULATOR
  ? RestAuthService.forEmulator(logger)
  : RestAuthService.forRemote(logger, import.meta.env.VITE_FIREBASE__API_KEY)
const authService = new FirebaseRestAuthService(restAuthService, logger, {
  permanent: storagePersistence(STORAGE_KEY_USER, storage),
  temporary: memoryPersistence(),
})

const emailPersistence = storagePersistence(STORAGE_KEY_EMAIL, storage)

const firestoreOptions = {
  apiKey: import.meta.env.VITE_FIREBASE__API_KEY,
  projectId: import.meta.env.VITE_FIREBASE__PROJECT_ID,
  databaseId: '(default)',
}

const firestoreService: FirestoreService = import.meta.env.VITE_FIREBASE__USE_EMULATOR
  ? createFirestoreRestServiceForEmulator(logger, firestoreOptions)
  : createFirestoreRestServiceForRemote(logger, firestoreOptions)
const firestoreDatabase = new FirestoreDatabase(logger, firestoreService)
const cacheDatabase = new IdbCacheDatabase(logger, firestoreDatabase, {
  cacheName: 'de.junigroup.app.recipebook',
  clearOnStart: true,
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const database = cacheDatabase

const root = document.getElementById('root')

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  )
}

render(
  () => (
    <AuthContextProvider authService={authService} emailPersistence={emailPersistence}>
      <RecipeBooksContextProvider logger={logger}>
        <App />
      </RecipeBooksContextProvider>
    </AuthContextProvider>
  ),
  root as HTMLElement,
)
