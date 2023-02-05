/* eslint-disable @typescript-eslint/no-use-before-define */
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { RootState } from '../business/app.store'
import * as fromAuth from '../business/auth'
import * as fromDB from '../business/db'

import { UNLOADED } from '../business/helper/redux/redux-helper'
import { AppRoutes } from './app-routes'
import { useAppDispatch } from './store.hooks'
import { LoadingSpinner } from './utils/loading-spinner'

const isLoaded = (data: unknown) => data !== UNLOADED

const dataLoadedFlag = (state: RootState) =>
  isLoaded(state.auth.rememberedEmail) && //
  isLoaded(state.auth.user)

const authorizedFlag = (state: RootState) => (isLoaded(state.auth.user) ? !!state.auth.user : UNLOADED)

export const App = () => {
  const dispatch = useAppDispatch()
  const dataLoaded = useSelector(dataLoadedFlag)
  const authorized = useSelector(authorizedFlag)

  useEffect(() => dispatch(fromAuth.fetchRememberedEmail()), [])
  useEffect(() => dispatch(fromAuth.observeUser()), [])
  useEffect(() => {
    if (authorized === true) dispatch(fromDB.openDB())
    if (authorized === false) dispatch(fromDB.closeAndDeleteDB())
  }, [authorized])

  return dataLoaded ? <AppRoutes /> : <LoadingSpinner />
}
