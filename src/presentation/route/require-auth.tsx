import { Navigate, useLocation } from 'react-router-dom'
import * as fromAuth from '../../business/auth'
import { useAppSelector } from '../store.hooks'

export const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const isLoggedIn = useAppSelector(fromAuth.selectAuthorized)
  const location = useLocation()

  if (!isLoggedIn) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
