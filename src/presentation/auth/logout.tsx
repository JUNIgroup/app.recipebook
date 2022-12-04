import { useAtomValue } from 'jotai'
import { useEffect } from 'react'
import { useLogoutHandler, UserAtom, useDeleteAccountHandler } from '../atoms/auth'

export const LogoutControl = () => {
  const user = useAtomValue(UserAtom)
  const logout = useLogoutHandler()
  const deleteAccount = useDeleteAccountHandler()
  useEffect(() => {
    logout.reset()
    deleteAccount.reset()
  }, [user])
  return (
    <>
      <button type="button" onClick={logout.handler} disabled={!user || logout.result.inProgress}>
        {user ? `Logout "${user?.name}"` : 'Logout'}
      </button>
      <div className={logout.result.failed ? 'auth-result error' : 'auth-result hide'}>
        Failed to logout - try later again
      </div>
      <button type="button" onClick={deleteAccount.handler} disabled={!user || deleteAccount.result.inProgress}>
        {user ? `Delete "${user?.name}"` : 'Delete account'}
      </button>
      <div className={deleteAccount.result.failed ? 'auth-result error' : 'auth-result hide'}>
        Failed to delete account - try later again
      </div>
    </>
  )
}
