/* eslint-disable @typescript-eslint/no-use-before-define */
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { RootState } from '../business/app.store'
import * as fromAuth from '../business/auth'

import { UNLOADED } from '../business/helper/redux/redux-helper'
import { AppRoutes } from './app-routes'
import { useAppDispatch } from './store.hooks'

const isLoaded = (data: unknown) => data !== UNLOADED

const dataLoadedFlag = (state: RootState) =>
  isLoaded(state.auth.rememberedEmail) && //
  isLoaded(state.auth.user)

export const App = () => {
  const dispatch = useAppDispatch()
  const dataLoaded = useSelector(dataLoadedFlag)

  useEffect(() => dispatch(fromAuth.fetchRememberedEmail()), [])
  useEffect(() => {
    setTimeout(() => {
      dispatch(fromAuth.observeUser())
    }, 1000)
  }, [])

  return dataLoaded ? <AppRoutes /> : null
}
