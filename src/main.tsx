import { Provider as JotaiProvider } from 'jotai'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { FirebaseAuthService } from './business/auth/firebase-auth-service'
import { FirebaseService } from './infrastructure/firebase/firebase-service'
import { AuthServiceAtom } from './presentation/atoms/auth'

import './index.scss'

const firebaseService = new FirebaseService()
const authService = new FirebaseAuthService(firebaseService)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <JotaiProvider initialValues={[AuthServiceAtom.setup(authService)]}>
        <App />
      </JotaiProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
