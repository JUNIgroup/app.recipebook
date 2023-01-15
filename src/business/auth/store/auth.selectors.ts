import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../../app.store'

const selectAuthState = (state: RootState) => state.auth

export const selectAuthInProgress = createSelector(
  selectAuthState, //
  (state) => state.authInProgress,
)

export const selectAuthError = createSelector(
  selectAuthState, //
  (state) => state.authError,
)

export const selectAuthorized = createSelector(
  selectAuthState, //
  (state) => state.user != null,
)

export const selectAuthorizedUser = createSelector(
  selectAuthState, //
  (state) => state.user,
)

export const selectRememberedEmail = createSelector(
  selectAuthState, //
  (state) => state.rememberedEmail,
)
