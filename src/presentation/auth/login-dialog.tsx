/* eslint-disable @typescript-eslint/no-use-before-define */
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ResetPasswordDialog } from './dialogs/reset-password'
import { SignInDialog } from './dialogs/sign-in'
import { SignUpDialog } from './dialogs/sign-up'
import { WelcomeDialog } from './dialogs/welcome'

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

const Layout = () => (
  <div className="login">
    <Outlet />
  </div>
)
