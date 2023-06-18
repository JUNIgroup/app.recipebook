import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider as StoreProvider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { IDB_ID } from './app.constants'
import { createStore } from './business/app.store'
import { FirebaseRestAuthService } from './business/auth/service/firebase-rest-auth-service'
import { IdbService } from './infrastructure/database/idb/idb.service'
import { dbUpgrades, dbVersion } from './infrastructure/database/idb/idb.upgrades'
import { memoryPersistence, storagePersistence } from './infrastructure/firebase/persistence'
import { RestAuthService } from './infrastructure/firebase/rest-auth-service'
import { App } from './presentation/app'
import { createConsoleLogger, createDebugObserver } from './utilities/logger'

import { FirestoreDatabase } from './business/recipe-books/database/firestore/firestore-database'
import { FirestoreService } from './business/recipe-books/database/firestore/firestore-service.api'
import './index.scss'
import {
  createFirestoreRestServiceForEmulator,
  createFirestoreRestServiceForRemote,
} from './infrastructure/firestore/firestore-rest-factory'

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
  permanent: storagePersistence(IDB_ID, storage),
  temporary: memoryPersistence(),
})

const dbService = new IdbService(indexedDB, IDB_ID, dbVersion, dbUpgrades, logger)

const firestoreOptions = {
  apiKey: import.meta.env.VITE_FIREBASE__API_KEY,
  projectId: import.meta.env.VITE_FIREBASE__PROJECT_ID,
  databaseId: '(default)',
}

const firestoreService: FirestoreService = import.meta.env.VITE_FIREBASE__USE_EMULATOR
  ? createFirestoreRestServiceForEmulator(logger, firestoreOptions)
  : createFirestoreRestServiceForRemote(logger, firestoreOptions)
const database = new FirestoreDatabase(logger, firestoreService)

const store = createStore({
  storage,
  authService,
  dbService,
  database,
  logger,
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider store={store}>
        <App />
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
