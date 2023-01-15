import { useNavigate } from 'react-router-dom'
import * as fromAuth from '../../business/auth'
import { useAppDispatch, useAppSelector } from '../store.hooks'

export const AuthStatus = () => {
  const user = useAppSelector(fromAuth.selectAuthorizedUser)
  const dispatch = useAppDispatch()

  const navigate = useNavigate()
  const logoutHandler = () => {
    dispatch(fromAuth.signOut()).then(() => navigate('/'))
  }

  if (!user) {
    return <p>You are not logged in.</p>
  }

  return (
    <p>
      Welcome {user.name}!{' '}
      <button type="button" onClick={logoutHandler}>
        Sign out
      </button>
    </p>
  )
}
