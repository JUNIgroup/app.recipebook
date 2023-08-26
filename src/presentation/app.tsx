import { Router } from '@solidjs/router'
import { Component, Show, lazy } from 'solid-js'
import { useAuthContext } from '../business/auth'
import { logMount } from './utils/log-mount'

const LoginRoutes = lazy(() => import('./auth/login-routes'))
const AppRoutes = lazy(() => import('./app-routes'))

export const App: Component = () => {
  logMount('App')
  const [authState] = useAuthContext()

  return (
    <Router>
      <Show when={authState.authUser} fallback={<LoginRoutes />} children={<AppRoutes />} />
    </Router>
  )
}
