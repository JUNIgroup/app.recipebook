/* eslint-disable @typescript-eslint/no-use-before-define */
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import { ResetPasswordDialog } from './dialogs/reset-password'
import { SignInDialog } from './dialogs/sign-in'
import { SignUpDialog } from './dialogs/sign-up'
import { WelcomeDialog } from './dialogs/welcome'

import './dialogs/styles.scss'
import { LoginDataProvider } from './dialogs/form-data'
import { useAppSelector } from '../store.hooks'
import { isAuthorized } from '../../business/auth/auth.selectors'

export const LoginDialog = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<WelcomeDialog />} />
      <Route path="welcome" element={<SignInDialog />} />
      <Route path="new-account" element={<SignUpDialog />} />
      <Route path="reset-password" element={<ResetPasswordDialog />} />
      <Route path="*" element={<Navigate replace to="" />} />
    </Route>
  </Routes>
)

const Layout = () => {
  const isLoggedIn = useAppSelector(isAuthorized)
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/'

  if (isLoggedIn) {
    // Redirect them to the original page stored in the `from` state of the location.
    return <Navigate to={from} replace />
  }

  return (
    <div className="login">
      <LoginDataProvider>
        <Outlet />
      </LoginDataProvider>
    </div>
  )
}
