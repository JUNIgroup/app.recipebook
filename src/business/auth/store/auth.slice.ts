/* eslint-disable no-param-reassign */

import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { ServiceErrorDto } from '../../error/service-error'
import { UNLOADED } from '../../helper/redux/redux-helper'
import type { AuthError, UserData } from '../service/auth-service'

export type AuthErrorDto = ServiceErrorDto<AuthError>

export type AuthState = {
  rememberedEmail?: string | null
  authInProgress: boolean
  user?: UserData | null
  authError: AuthErrorDto | null
}

const initialState: AuthState = {
  rememberedEmail: UNLOADED,
  authInProgress: false,
  user: UNLOADED,
  authError: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** set/reset the value for the email to remember for next login */
    updateRememberedEmail(state, action: PayloadAction<{ email: string | null }>) {
      const { email } = action.payload
      state.rememberedEmail = email
    },

    /** set/reset the current user */
    updateCurrentUser(state, action: PayloadAction<{ user: UserData | null }>) {
      const { user } = action.payload
      state.user = user
    },

    /** reset all login data */
    resetLogin(state) {
      state.authInProgress = false
      state.user = null
      state.authError = null
    },

    /** start the login/logout process */
    startAuth(state) {
      state.authInProgress = true
    },

    /** login/logout process finished, optional with error */
    finishAuth(state, action: PayloadAction<{ error?: AuthErrorDto }>) {
      const { error } = action.payload
      state.authInProgress = false
      state.authError = error ?? null
    },
  },
})

// Extract the action creators object and the reducer
export const { actions, reducer: authReducer } = authSlice
