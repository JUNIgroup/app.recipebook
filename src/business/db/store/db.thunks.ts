/* eslint-disable max-classes-per-file */
import { catchError, map, of } from 'rxjs'
import { ReadTransaction, UpdateTransaction } from '../../../infrastructure/database/rdb.service'
import { AppThunk, Services } from '../../app.store'
import { OutdatedError } from './db.errors'
import { convertMetaRecordToMetaData, validateUpdateMetaRecord } from './db.metadata'
import { actions } from './db.slice'
import { DBOpenState } from './db.types'

type SupportedStoreName = 'recipes'

export function openDB(): AppThunk<void> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    dbService
      .openDB()
      .pipe(
        map((state) => (state === 'open' ? DBOpenState.OPEN : DBOpenState.UPGRADE_BLOCKED)),
        catchError(() => of(DBOpenState.OPEN_FAILED)),
      )
      .subscribe((state) => dispatch(actions.setOpenState({ state })))
  }
}

export function closeAndDeleteDB(): AppThunk<void> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    dbService
      .closeAndDeleteDB()
      .pipe(
        map((state) => (state === 'deleted' ? DBOpenState.DELETED : DBOpenState.DELETE_BLOCKED)),
        catchError(() => of(DBOpenState.DELETE_FAILED)),
      )
      .subscribe((state) => dispatch(actions.setOpenState({ state })))
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
