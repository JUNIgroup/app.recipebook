/* eslint-disable jsx-a11y/label-has-associated-control */
import { useAtom, useAtomValue } from 'jotai'
import { ChangeEventHandler, useEffect } from 'react'
import { UserAtom, useChangeNameHandler, useChangeEmailHandler, useChangePasswordHandler } from '../atoms/auth'
import { FormUserAtom } from './form-user'

type UpdateButtonParams = {
  value: string
  refValue?: string
  useChangeHandler: typeof useChangeNameHandler
}

const UpdateButton = ({ value, refValue, useChangeHandler }: UpdateButtonParams) => {
  const enabled = value && refValue != null && value !== refValue
  const change = useChangeHandler()
  return (
    <button type="button" disabled={!enabled || change.result.inProgress} onClick={() => change.handler(value)}>
      {enabled ? '✔️' : '✓'}
    </button>
  )
}

export const AuthForm = () => {
  const user = useAtomValue(UserAtom)
  const [formUser, setFormUser] = useAtom(FormUserAtom)
  const changeHandler: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { id, value } = event.target
    setFormUser({ [id]: value })
  }
  useEffect(() => {
    console.log('User', user)
  }, [user])
  return (
    <div className="auth-form">
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" type="text" value={formUser.name} onChange={changeHandler} />
        <UpdateButton value={formUser?.name} refValue={user?.name} useChangeHandler={useChangeNameHandler} />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={formUser.email} onChange={changeHandler} />
        <UpdateButton value={formUser?.email} refValue={user?.email} useChangeHandler={useChangeEmailHandler} />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={formUser.password} onChange={changeHandler} />
        <UpdateButton
          value={formUser?.password}
          refValue={user ? '' : undefined}
          useChangeHandler={useChangePasswordHandler}
        />
      </div>{' '}
    </div>
  )
}
