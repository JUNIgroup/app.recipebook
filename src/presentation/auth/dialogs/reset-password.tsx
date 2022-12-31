/* eslint-disable jsx-a11y/label-has-associated-control */
import { useNavigate } from 'react-router-dom'
import * as fromAuth from '../../../business/auth'
import { useAppDispatch, useAppSelector } from '../../store.hooks'
import { ContinueSubmit, EmailInput, ErrorMessage, Message, RememberPasswordLink } from './elements'

export const ResetPasswordDialog = () => {
  const dispatch = useAppDispatch()
  const authError = useAppSelector(fromAuth.selectAuthError)
  const navigate = useNavigate()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string

    dispatch(fromAuth.resetPassword(email)).then(() => navigate('/login/welcome'))
  }

  return (
    <div className="dialog">
      <form onSubmit={handleSubmit}>
        <h2>Reset password</h2>
        <Message>We will send you an email with a link to set a new password.</Message>
        <EmailInput />
        <ErrorMessage error={authError} />
        <ContinueSubmit />
      </form>
      <RememberPasswordLink />
    </div>
  )
}
