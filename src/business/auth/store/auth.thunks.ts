import type { AppThunk, Services } from '../../app.store'
import { RememberedEmailStorageKey } from '../../constants'
import { toServiceErrorDto } from '../../error/service-error'
import type { AuthError, LoginOptions, Unsubscribe } from '../service/auth-service'
import { actions } from './auth.slice'

export function fetchRememberedEmail(): AppThunk {
  return (dispatch, _getState, services) => {
    const email = services.storage.getItem(RememberedEmailStorageKey) || null
    dispatch(actions.updateRememberedEmail({ email }))
  }
}

export function storeRememberedEmail(email: string | null): AppThunk {
  return (dispatch, _getState, services) => {
    if (email) {
      services.storage.setItem(RememberedEmailStorageKey, email)
    } else {
      services.storage.removeItem(RememberedEmailStorageKey)
    }
    dispatch(actions.updateRememberedEmail({ email }))
  }
}

export function observeUser(): AppThunk<Unsubscribe> {
  return (dispatch, _getState, services: Services) => {
    const unsubscribe = services.authService.observeUser((user) => {
      dispatch(actions.updateCurrentUser({ user }))
      //
    })
    return unsubscribe
  }
}

export function signIn(
  email: string, //
  password: string,
  options?: LoginOptions,
): AppThunk<Promise<void>> {
  return (dispatch, _getState, services: Services) => {
    dispatch(actions.startAuth())
    const finished = services.authService.signInWithEmailAndPassword(email, password, options)
    finished.then(
      () => {
        dispatch(storeRememberedEmail(options?.rememberMe ? email : null))
        dispatch(actions.finishAuth({}))
      },
      (error: AuthError) => {
        dispatch(actions.finishAuth({ error: toServiceErrorDto(error) }))
      },
    )
    return finished
  }
}

export function signUp(
  name: string, //
  email: string,
  password: string,
  options?: LoginOptions,
): AppThunk<Promise<void>> {
  return (dispatch, _getState, services: Services) => {
    dispatch(actions.startAuth())
    const finished = services.authService.signUpWithEmailAndPassword(name, email, password, options)
    finished.then(
      () => {
        dispatch(storeRememberedEmail(options?.rememberMe ? email : null))
        dispatch(actions.finishAuth({}))
      },
      (error: AuthError) => {
        dispatch(actions.finishAuth({ error: toServiceErrorDto(error) }))
      },
    )
    return finished
  }
}

export function signOut(): AppThunk<Promise<void>> {
  return (dispatch, _getState, services: Services) => {
    dispatch(actions.startAuth())
    const finished = services.authService.logout()
    finished.then(
      () => {
        dispatch(actions.finishAuth({}))
      },
      (error: AuthError) => {
        dispatch(actions.finishAuth({ error: toServiceErrorDto(error) }))
      },
    )
    return finished
  }
}

export function resetPassword(email: string): AppThunk<Promise<void>> {
  return (dispatch, _getState, services: Services) => {
    dispatch(actions.startAuth())
    const finished = services.authService.resetPassword(email)
    finished.then(
      () => {
        dispatch(actions.finishAuth({}))
      },
      (error: AuthError) => {
        dispatch(actions.finishAuth({ error: toServiceErrorDto(error) }))
      },
    )
    return finished
  }
}
