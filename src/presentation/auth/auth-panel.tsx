import { AuthForm } from './auth-form'
import { AuthStatus } from './auth-status'
import './auth.scss'
import { LoginControl } from './login'
import { LogoutControl } from './logout'
import { SelectUserControl } from './select-user'

export const AuthPanel = () => (
  <div className="auth-panel">
    <div className="left">
      <div>
        AuthPanel: <AuthStatus />
      </div>
      <LogoutControl />
      <SelectUserControl email={import.meta.env.VITE_USER1_EMAIL} password={import.meta.env.VITE_USER1_PASSWORD} />
      <SelectUserControl email={import.meta.env.VITE_USER2_EMAIL} password={import.meta.env.VITE_USER2_PASSWORD} />
    </div>
    <div className="right">
      <AuthForm />
      <LoginControl />
    </div>
  </div>
)
