import { Navigate, Outlet, Route, Routes } from '@solidjs/router'
import { onMount } from 'solid-js'
import { hideSplash } from '../landing/hide-splash'
import { AuthStatus } from './auth-status'
import { LandingPage } from '../landing/landing-page'
import { LoginDataContextProvider } from './dialogs/form-data'
import { SignInDialog } from './dialogs/sign-in'
import { SignUpDialog } from './dialogs/sign-up'
import { ResetPasswordDialog } from './dialogs/reset-password'

import './dialogs/styles.scss'
import { logMount } from '../utils/log-mount'

const LoginRoutes = () => {
  logMount('LoginRoutes')
  onMount(hideSplash)

  return (
    <Routes>
      <Route path="/" component={LandingPage} />
      <Route
        path="/login"
        element={
          <div class="login">
            <AuthStatus />
            <LoginDataContextProvider>
              <Outlet />
            </LoginDataContextProvider>
          </div>
        }
      >
        <Route path="sign-in" component={SignInDialog} />
        <Route path="sign-up" component={SignUpDialog} />
        <Route path="reset-password" component={ResetPasswordDialog} />
      </Route>
      <Route path="/*" element={<Navigate href="/" />} />
    </Routes>
  )
}

// for lazy loading, export as default
export default LoginRoutes
