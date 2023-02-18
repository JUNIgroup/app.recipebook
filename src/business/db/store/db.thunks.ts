/* eslint-disable max-classes-per-file */
import { ReadTransaction, UpdateTransaction } from '../../../infrastructure/database/rdb.service'
import { AppThunk, Services } from '../../app.store'
import { convertMetaRecordToMetaData, validateUpdateMetaRecord } from './db.metadata'
import { actions } from './db.slice'
import { DBOpenState } from './db.types'
import { OutdatedError } from './db.errors'

type SupportedStoreName = 'recipes'

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
        dispatch(actions.setOpenState({ open: DBOpenState.DELETE_BLOCKED }))
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

export function readFromDB<T, StoreName extends SupportedStoreName>(
  storeNames: StoreName | StoreName[],
  onTransaction: (tx: ReadTransaction<StoreName>) => Promise<T>,
): AppThunk<Promise<T>> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    const [metaRecord, result] = await dbService.executeReadTransaction(storeNames, {
      onTransaction,
    })
    const metaData = convertMetaRecordToMetaData(metaRecord)
    dispatch(actions.updateObjectMetaData({ metaData }))
    return result
  }
}

export function updateInDB<StoreName extends SupportedStoreName>(
  storeNames: StoreName | StoreName[],
  onTransaction: (tx: UpdateTransaction<StoreName>) => Promise<void>,
): AppThunk<Promise<void>> {
  return async (dispatch, getState, services: Services) => {
    const initialMetaData = getState().db.objectMetaData
    const { dbService } = services
    const [metaRecord] = await dbService.executeUpdateTransaction(storeNames, {
      onTransaction,
      validatePreviousMeta: (beforeMetaRecord) => {
        const outdated = validateUpdateMetaRecord(beforeMetaRecord, initialMetaData)
        if (outdated) {
          dispatch(actions.outdateObjects({ objectIds: Object.keys(outdated) }))
          throw new OutdatedError(outdated)
        }
      },
    })
    const metaData = convertMetaRecordToMetaData(metaRecord)
    dispatch(actions.updateObjectMetaData({ metaData }))
  }
}
