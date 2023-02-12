/* eslint-disable max-classes-per-file */
import { AppThunk, Services } from '../../app.store'
import { actions } from './db.slice'
import { DBOpenState } from './db.types'
import { StoreNames } from './idb.service'
import { OutdatedError } from './db.errors'
import {
  convertReadMetaRecordToMetaData,
  convertUpdateMetaRecordToMetaData,
  IdbReadTransaction,
  IdbUpdateTransaction,
  ReadMetaRecord,
  ReadTransaction,
  UpdateMetaRecord,
  UpdateTransaction,
  validateUpdateMetaRecord,
} from './idb.transactions'

export type { StoreNames } from './idb.service'

export function openDB(): AppThunk<void> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    dbService.openDB({
      onBlocked: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.UPGRADE_BLOCKED }))
      },
      onError: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.OPEN_FAILED }))
      },
      onOpen: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.OPEN }))
      },
    })
  }
}

export function closeAndDeleteDB(): AppThunk<void> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    dbService.closeAndDeleteDB({
      onBlocked: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.UPGRADE_BLOCKED }))
      },
      onError: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.OPEN_FAILED }))
      },
      onDelete: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.DELETED }))
      },
    })
  }
}

export function readFromDB<T>(
  storeNames: StoreNames | StoreNames[],
  callback: (tx: ReadTransaction) => Promise<T>,
): AppThunk<Promise<T>> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    const metaRecord: ReadMetaRecord = {}
    const result = await dbService.startReadTransaction(storeNames, (tx) => {
      const rtx: ReadTransaction = new IdbReadTransaction(tx, metaRecord)
      return callback(rtx)
    })
    const metaData = convertReadMetaRecordToMetaData(metaRecord)
    dispatch(actions.updateObjectMetaData({ metaData }))
    return result
  }
}

export function updateInDB(
  storeNames: StoreNames | StoreNames[],
  callback: (tx: UpdateTransaction) => Promise<void>,
): AppThunk<Promise<void>> {
  return async (dispatch, getState, services: Services) => {
    const initialMetaData = getState().db.objectMetaData
    const { dbService } = services
    const metaRecord: UpdateMetaRecord = {}
    await dbService.startUpdateTransaction(storeNames, async (tx) => {
      const utx: IdbUpdateTransaction = new IdbUpdateTransaction(tx, metaRecord)
      await callback(utx)
      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)
      if (outdated) {
        dispatch(actions.outdateObjects({ objectIds: Object.keys(outdated) }))
        throw new OutdatedError(outdated)
      }
    })
    const metaData = convertUpdateMetaRecordToMetaData(metaRecord)
    dispatch(actions.updateObjectMetaData({ metaData }))
  }
}
