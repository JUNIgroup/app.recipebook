import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider as StoreProvider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { createStore } from './business/app.store'
import { FirebaseAuthService } from './business/auth/service/firebase-auth-service'
import { FirebaseService } from './infrastructure/firebase/firebase-service'

import './index.scss'

const firebaseService = new FirebaseService()
const authService = new FirebaseAuthService(firebaseService)
const storage = localStorage

const store = createStore({
  storage,
  authService,
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
