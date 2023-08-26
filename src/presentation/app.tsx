import { Router } from '@solidjs/router'
import { Component, Show, createSignal, lazy } from 'solid-js'
import { useAuthContext } from '../business/auth/reactives/auth-context'
import { logMount } from './utils/log-mount'

export const App: Component = () => {
  logMount('App')

  const [dataLoaded, setDataLoaded] = createSignal(false)
  setTimeout(() => setDataLoaded(true), 1000)

  const [authState] = useAuthContext()
  const LoginRoutes = lazy(() => import('./auth/login-routes'))
  const AppRoutes = lazy(() => import('./app-routes'))

  return (
    <Show when={dataLoaded()}>
      <Router>
        <Show when={authState.authUser} fallback={<LoginRoutes />} children={<AppRoutes />} />
      </Router>
    </Show>
  )
}
