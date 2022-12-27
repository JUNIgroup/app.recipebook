import { Link } from 'react-router-dom'
import { AuthError } from '../../../business/auth/auth-service'

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

export const EmailInput = () => (
  <>
    <label htmlFor="email">Email:</label>
    <input type="text" id="email" name="email" />
  </>
)

export const NameInput = () => (
  <>
    <label htmlFor="name">Nickname:</label>
    <input type="text" id="name" name="name" />
  </>
)

export const PasswordInput = () => (
  <>
    <label htmlFor="password">Password:</label>
    <input type="password" id="password" name="password" />
  </>
)

export const RememberMeInput = () => (
  <div className="checkbox">
    <input id="remember-me" name="remember-me" type="checkbox" />
    <label htmlFor="remember-me">Remember Me</label>
  </div>
)

export const ContinueSubmit = () => <button type="submit">Continue</button>

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
  error?: unknown
}

export const ErrorMessage: React.FC<ErrorProps> = ({ error }) => {
  if (!error) return null

  const msg = error instanceof AuthError ? error.plainMessage : 'internal error'
  return <div className="error">{msg}</div>
}
