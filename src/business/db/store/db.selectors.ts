import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../../app.store'
import { DBObjectState } from './db.types'

type PartialRootState = Pick<RootState, 'db'>

const selectDBState = (state: PartialRootState) => state.db

export const selectDBOpenState = createSelector(
  selectDBState, //
  (state) => state.open,
)

export const selectDBObjectMetaDataById = createSelector(
  [selectDBState, (_state: PartialRootState, id: string) => id], //
  (state, id) => state.objectMetaData[id] ?? undefined,
)

export const selectDBObjectStateById = createSelector(
  [selectDBState, (_state: PartialRootState, id: string) => id], //
  (state, id) => state.objectMetaData[id].state ?? DBObjectState.OUTDATED,
)
