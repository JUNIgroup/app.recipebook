import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../app.store'

const selectAuthState = (state: RootState) => state.auth

export const isAuthInProgress = createSelector(
  selectAuthState, //
  (state) => state.authInProgress,
)

export const getAuthError = createSelector(
  selectAuthState, //
  (state) => state.authError,
)

export const isAuthorized = createSelector(
  selectAuthState, //
  (state) => state.user != null,
)

export const getAuthorizedUser = createSelector(
  selectAuthState, //
  (state) => state.user,
)

export const getRememberedEmail = createSelector(
  selectAuthState, //
  (state) => state.rememberedEmail,
)
