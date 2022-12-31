import { ChangeEventHandler } from 'react'
import { Link } from 'react-router-dom'
import type { AuthErrorDto } from '../../../business/auth'
import * as fromAuth from '../../../business/auth'
import { useAppSelector } from '../../store.hooks'
import { useLoginData } from './form-data'

const rootPath = '/login'

type ChildrenProps = { children: React.ReactNode }

export const Logo = () => <div className="login-logo">LOGO</div>

export const Message: React.FC<ChildrenProps> = ({ children }) => <div className="login-message">{children}</div>

export const SignInButton = () => (
  <Link className="link-as-button" to="welcome">
    Log in
  </Link>
)

export const SignUpButton = () => (
  <Link className="link-as-button" to="new-account">
    Sign up
  </Link>
)

export const EmailInput = () => {
  const [loginData, update] = useLoginData()
  const changeHandler: ChangeEventHandler<HTMLInputElement> = (event) => {
    const email = event.target.value
    update((data) => ({ ...data, email }))
  }
  return (
    <>
      <label htmlFor="email">Email:</label>
      <input type="text" id="email" name="email" value={loginData.email} onChange={changeHandler} />
    </>
  )
}

export const NameInput = () => {
  const [loginData, update] = useLoginData()
  const changeHandler: ChangeEventHandler<HTMLInputElement> = (event) => {
    const name = event.target.value
    update((data) => ({ ...data, name }))
  }
  return (
    <>
      <label htmlFor="name">Nickname:</label>
      <input type="text" id="name" name="name" value={loginData.name} onChange={changeHandler} />
    </>
  )
}

export const PasswordInput = () => (
  <>
    <label htmlFor="password">Password:</label>
    <input type="password" id="password" name="password" />
  </>
)

export const RememberMeInput = () => {
  const [loginData, update] = useLoginData()
  const changeHandler: ChangeEventHandler<HTMLInputElement> = (event) => {
    const rememberMe = event.target.checked
    update((data) => ({ ...data, rememberMe }))
  }
  return (
    <div className="checkbox">
      <input
        id="remember-me"
        name="remember-me"
        type="checkbox"
        checked={loginData.rememberMe}
        onChange={changeHandler}
      />
      <label htmlFor="remember-me">Remember Me</label>
    </div>
  )
}

export const ContinueSubmit = () => {
  const inProgress = useAppSelector(fromAuth.selectAuthInProgress)
  return (
    <button type="submit" disabled={inProgress}>
      Continue
    </button>
  )
}

export const ResetPasswordLink = () => (
  <div>
    <Link to={`${rootPath}/reset-password`} replace>
      Forgot Password?
    </Link>
  </div>
)

export const RememberPasswordLink = () => (
  <div>
    <Link to={`${rootPath}/welcome`} replace>
      Remember Password?
    </Link>
  </div>
)

export const SignUpLink = () => (
  <div>
    Don&apos;t have an account?{' '}
    <Link to={`${rootPath}/new-account`} replace>
      Sign up
    </Link>
  </div>
)

export const SignInLink = () => (
  <div>
    Already have an account?{' '}
    <Link to={`${rootPath}/welcome`} replace>
      Log in
    </Link>
  </div>
)

type ErrorProps = {
  error?: AuthErrorDto | null
}

export const ErrorMessage: React.FC<ErrorProps> = ({ error }) => {
  if (!error) return null

  const msg = error.plainMessage
  return <div className="error">{msg}</div>
}
