import { Link } from '@solidjs/router'
import { Component, ParentComponent, JSX, Show } from 'solid-js'
import type { AuthErrorDto } from '../../../business/auth'
import { useLoginDataContext } from './form-data'
import { useAuthContext } from '../../../business/auth/reactives/auth-context'

const rootPath = '/login'

export const Logo: Component = () => <div class="login-logo">LOGO</div>

export const Message: ParentComponent = (props) => <div class="login-message">{props.children}</div>

export const SignInButton: Component = () => (
  <Link class="link-as-button" href={`${rootPath}/sign-in`}>
    Log in
  </Link>
)

export const SignUpButton: Component = () => (
  <Link class="link-as-button" href={`${rootPath}/sign-up`}>
    Sign up
  </Link>
)

type ChangeHandler<T extends HTMLElement> = JSX.EventHandler<T, Event>

export const EmailInput: Component = () => {
  const [loginData, update] = useLoginDataContext()
  const changeHandler: ChangeHandler<HTMLInputElement> = (event) => {
    const email = event.currentTarget.value
    update('email', email)
  }
  return (
    <>
      <label for="email">Email:</label>
      <input type="text" id="email" name="email" value={loginData.email} onChange={changeHandler} />
    </>
  )
}

export const NameInput: Component = () => {
  const [loginData, update] = useLoginDataContext()
  const changeHandler: ChangeHandler<HTMLInputElement> = (event) => {
    const name = event.currentTarget.value
    update('name', name)
  }
  return (
    <>
      <label for="name">Nickname:</label>
      <input type="text" id="name" name="name" value={loginData.name} onChange={changeHandler} />
    </>
  )
}

export const PasswordInput: Component = () => (
  <>
    <label for="password">Password:</label>
    <input type="password" id="password" name="password" />
  </>
)

export const RememberMeInput: Component = () => {
  const [loginData, update] = useLoginDataContext()
  const changeHandler: ChangeHandler<HTMLInputElement> = (event) => {
    const rememberMe = event.currentTarget.checked
    update((data) => ({ ...data, rememberMe }))
  }
  return (
    <div class="checkbox">
      <input
        id="remember-me"
        name="remember-me"
        type="checkbox"
        checked={loginData.rememberMe}
        onChange={changeHandler}
      />
      <label for="remember-me">Remember Me</label>
    </div>
  )
}

export const ContinueSubmit: Component = () => {
  const [authState] = useAuthContext()
  return (
    <button type="submit" disabled={authState.authInProgress}>
      Continue
    </button>
  )
}

export const ResetPasswordLink: Component = () => (
  <div>
    <Link href={`${rootPath}/reset-password`} replace>
      Forgot Password?
    </Link>
  </div>
)

export const RememberPasswordLink = () => (
  <div>
    <Link href={`${rootPath}/sign-in`} replace>
      Remember Password?
    </Link>
  </div>
)

export const SignUpLink: Component = () => (
  <div>
    Don&apos;t have an account?{' '}
    <Link href={`${rootPath}/sign-up`} replace>
      Sign Up
    </Link>
  </div>
)

export const SignInLink: Component = () => (
  <div>
    Already have an account?{' '}
    <Link href={`${rootPath}/sign-in`} replace>
      Sign In
    </Link>
  </div>
)

type ErrorProps = {
  error?: AuthErrorDto | null
}

export const ErrorMessage: Component<ErrorProps> = (props) => (
  <Show when={props.error}>{(error) => <div class="error">{error().plainMessage}</div>}</Show>
)
