/* eslint-disable @typescript-eslint/no-use-before-define */
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import { ResetPasswordDialog } from './dialogs/reset-password'
import { SignInDialog } from './dialogs/sign-in'
import { SignUpDialog } from './dialogs/sign-up'
import { WelcomeDialog } from './dialogs/welcome'

import * as fromAuth from '../../business/auth'
import { useAppSelector } from '../store.hooks'
import { LoginDataProvider } from './dialogs/form-data'

import './dialogs/styles.scss'

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
  const isLoggedIn = useAppSelector(fromAuth.selectAuthorized)
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
