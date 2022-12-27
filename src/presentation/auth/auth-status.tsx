import { useNavigate } from 'react-router-dom'
import { useLogoutHandler, useUser } from '../atoms/auth'

export const AuthStatus = () => {
  const user = useUser()
  const navigate = useNavigate()
  const logout = useLogoutHandler({
    onSuccess: () => navigate('/'),
  })

  if (!user) {
    return <p>You are not logged in.</p>
  }

  return (
    <p>
      Welcome {user.name}!{' '}
      <button type="button" onClick={logout.handler}>
        Sign out
      </button>
    </p>
  )
}
