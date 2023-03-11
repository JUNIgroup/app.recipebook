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
import { createConsoleLogger } from './utilities/logger'

import './index.scss'

type LogScope = 'app' | 'utils' | 'infra' | 'business' | 'ui'

const logger = createConsoleLogger<LogScope>()

if (import.meta.env.DEV) {
  logger.enableLogs('*')
  logger('app:main').warn('Running in development mode')
}

const storage = localStorage
// const firebaseService = new FirebaseService()
// const authServiceOld = new FirebaseAuthService(firebaseService)
const restAuthService = import.meta.env.VITE_FIREBASE__USE_EMULATOR
  ? RestAuthService.forEmulator(logger)
  : RestAuthService.forRemote(logger, import.meta.env.VITE_FIREBASE__API_KEY)
const authService = new FirebaseRestAuthService(restAuthService, logger, {
  permanent: storagePersistence(IDB_ID, storage),
  temporary: memoryPersistence(),
})
const dbService = new IdbService(indexedDB, IDB_ID, dbVersion, dbUpgrades, logger)

const store = createStore({
  storage,
  authService,
  dbService,
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
