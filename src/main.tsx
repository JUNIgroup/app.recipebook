import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider as StoreProvider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { IDB_ID } from './app.constants'
import { createStore } from './business/app.store'
import { FirebaseAuthService } from './business/auth/service/firebase-auth-service'
import { IdbService } from './infrastructure/database/idb/idb.service'
import { dbUpgrades, dbVersion } from './infrastructure/database/idb/idb.upgrades'
import { FirebaseService } from './infrastructure/firebase/firebase-service'
import { App } from './presentation/app'

import './index.scss'

const storage = localStorage
const firebaseService = new FirebaseService()
const authService = new FirebaseAuthService(firebaseService)
const dbService = new IdbService(indexedDB, IDB_ID, dbVersion, dbUpgrades)

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
