import { useAtom } from 'jotai'
import { FormUserAtom } from './form-user'

type SelectUserProps = { name?: string; email: string; password: string }
export const SelectUserControl = ({ name, email, password }: SelectUserProps) => {
  const [, setFormUser] = useAtom(FormUserAtom)

  const displayName = name ?? email.replace(/[.@].*/, '')
  const setHandler = () => {
    setFormUser({ name: displayName, email, password })
  }
  return (
    <button type="button" onClick={setHandler}>
      Select &quot;{displayName}&quot;
    </button>
  )
}
