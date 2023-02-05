/* eslint-disable no-param-reassign */

import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { UNLOADED } from '../../helper/redux/redux-helper'

export enum DBOpenState {
  /** Upgrade of the DB is blocked. Please refresh all windows with this app */
  UPGRADE_BLOCKED = 'UPGRADE_BLOCKED',

  /** Delete of the DB is blocked. Please refresh all windows with this app */
  DELETE_BLOCKED = 'DELETE_BLOCKED',

  /** DB could not be open and is not available */
  OPEN_FAILED = 'OPEN_FAILED',

  /** DB is open and available */
  OPEN = 'OPEN',

  /** DB could not be open and is not available */
  DELETE_FAILED = 'OPEN_FAILED',

  /** DB is closed  */
  CLOSED = 'CLOSED',

  /** DB is closed and deleted */
  DELETED = 'DELETED',
}

export type DatabaseState = {
  open?: DBOpenState
}

const initialState: DatabaseState = {
  open: UNLOADED,
}

const dbSlice = createSlice({
  name: 'db',
  initialState,
  reducers: {
    /** set/reset the value for the email to remember for next login */
    setOpenState(state, action: PayloadAction<{ open: DBOpenState }>) {
      const { open } = action.payload
      state.open = open
    },
  },
})

// Extract the action creators object and the reducer
export const { actions, reducer: dbReducer } = dbSlice
