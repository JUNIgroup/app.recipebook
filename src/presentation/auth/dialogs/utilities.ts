import { useLocation, useNavigate } from 'react-router-dom'

export const useNavigateContinue = () => {
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const navigate = useNavigate()
  return () => navigate(from, { replace: true })
}
