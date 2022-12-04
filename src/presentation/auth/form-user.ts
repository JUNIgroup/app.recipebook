import { atom } from 'jotai'
import { UserAtom } from '../atoms/auth'

export type FormUserData = { name: string; email: string; password: string }
type Timestamp = { t: number }

const nullData: FormUserData & Timestamp = Object.freeze({ name: '', email: '', password: '', t: 0 })

const atomForFormUser = () => {
  const formUserWithTimestamp = atom<FormUserData & Timestamp>(nullData)
  const authUserWithTimestamp = atom<FormUserData & Timestamp>((get) => {
    const authUser = get(UserAtom)
    return authUser
      ? { name: authUser.name, email: authUser.email ?? '', password: '', t: Date.now() }
      : { ...nullData, t: Date.now() }
  })
  const combineAtom = atom(
    (get) => {
      const { t: t1, ...formUser } = get(formUserWithTimestamp)
      const { t: t2, ...authUser } = get(authUserWithTimestamp)
      return t1 > t2 ? formUser : authUser
    },
    (_get, set, data: Partial<FormUserData>) => {
      set(formUserWithTimestamp, (current) => ({ ...current, ...data, t: Date.now() }))
    },
  )
  return combineAtom
}

export const FormUserAtom = atomForFormUser()
