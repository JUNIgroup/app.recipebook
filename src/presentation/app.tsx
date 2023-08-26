import { Component, Show, createSignal, onMount } from 'solid-js'

import { useAuthContext } from '../business/auth/reactives/auth-context'
import { LandingPage } from './landing/landing-page'

const AppFakeRoutes = () => {
  onMount(() => {
    document.getElementById('splash-section')?.remove()
  })

  const [authState] = useAuthContext()

  return (
    <Show when={authState.authUser} fallback={<LandingPage />}>
      {(user) => <div>Hello User: {user().name}</div>}
    </Show>
  )
}

export const App: Component = () => {
  const [dataLoaded, setDataLoaded] = createSignal(false)
  setTimeout(() => setDataLoaded(true), 1000)

  return (
    <Show when={dataLoaded()}>
      <AppFakeRoutes />
    </Show>
  )
}
