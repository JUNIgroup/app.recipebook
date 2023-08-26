import { useNavigate } from '@solidjs/router'
import { Show } from 'solid-js'
import { useAuthContext } from '../../business/auth/reactives/auth-context'

export const AuthStatus = () => {
  const [authState, authActions] = useAuthContext()
  const navigate = useNavigate()

  const logoutHandler = () => {
    authActions.signOut().then(() => navigate('/'))
  }

  return (
    <Show when={authState.authUser} fallback={<p>You are not logged in.</p>}>
      {(user) => (
        <p>
          Welcome {user.name}!{' '}
          <button type="button" onClick={logoutHandler}>
            Sign out
          </button>
        </p>
      )}
    </Show>
  )
}
