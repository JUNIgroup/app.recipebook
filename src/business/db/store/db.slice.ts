/* eslint-disable no-param-reassign */

import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { UNLOADED } from '../../helper/redux/redux-helper'
import { DBObjectMetaData, DBOpenState, DBObjectState } from './db.types'

export type DatabaseState = {
  open?: DBOpenState
  objectMetaData: Record<string, DBObjectMetaData>
}

const initialState: DatabaseState = {
  open: UNLOADED,
  objectMetaData: {},
}

const dbSlice = createSlice({
  name: 'db',
  initialState,
  reducers: {
    /** set/reset the value for the email to remember for next login */
    setOpenState(state, action: PayloadAction<{ state: DBOpenState }>) {
      const { state: openState } = action.payload
      state.open = openState
    },

    /** Update the meta data for the given objects. */
    updateObjectMetaData(state, action: PayloadAction<{ metaData: DBObjectMetaData[] }>) {
      const { metaData } = action.payload
      metaData.forEach((md) => {
        state.objectMetaData[md.id] = md
      })
    },

    /** Update the meta data for the given objects to be outdated. */
    outdateObjects(state, action: PayloadAction<{ objectIds: string[] }>) {
      const { objectIds } = action.payload
      objectIds.forEach((id) => {
        if (id in state.objectMetaData) {
          state.objectMetaData[id].state = DBObjectState.OUTDATED
        }
      })
    },
  },
})

// Extract the action creators object and the reducer
export const { actions, reducer: dbReducer } = dbSlice
