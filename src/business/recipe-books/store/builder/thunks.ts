import { AnyAction, ThunkAction } from '@reduxjs/toolkit'
import { Log } from '../../../../utilities/logger'
import { CollectionPath, Database } from '../../database/database'
import { BucketName, BucketStructure, CollectionName, Doc, ID } from '../../database/database-types'
import { BucketsActionCreator } from './slice.types'

type Services = {
  database: Database
  thunkLogs: Record<string, Log>
}

type ThunkActionCreator<R = Promise<void>> = () => ThunkAction<R, unknown, Services, AnyAction>

type ThunkActionCreatorWithPayload<P, R = Promise<void>> = (payload: P) => ThunkAction<R, unknown, Services, AnyAction>

export type ThunkContext<T extends BucketStructure> = {
  sliceName: BucketName
  actions: BucketsActionCreator<T>
}

/**
 * Returns a action creator that creates a async thunk action to refresh all bucket documents.
 *
 * The thunk action will fetch all bucket documents from the database and update the state.
 *
 * The thunk action returns a promise that resolves when the action is completed.
 *
 * @param sliceName the name of the slice
 * @param actions access to the sync bucket actions of the slice
 * @returns the action creator
 */
export function createRefreshBucketDocuments<T extends BucketStructure>({
  sliceName,
  actions,
}: ThunkContext<T>): ThunkActionCreator {
  const collectionPath: CollectionPath = { bucket: sliceName }
  return () => async (dispatch, _, extra) => {
    const { thunkLogs, database } = extra
    const log = thunkLogs[sliceName]

    const task = `refresh: ${sliceName}`
    log.details(task)

    let lastUpdate: number | undefined // Number.NEGATIVE_INFINITY
    await new Promise<void>((resolve, reject) => {
      database.getDocs(collectionPath).subscribe({
        next: (results) => {
          const documents: Doc[] = []
          const deleted: ID[] = []
          results.forEach((result) => {
            log.details(`${task}/${result.doc.id}: `, result.lastUpdate)
            lastUpdate = result.lastUpdate
            if (isDeleted(result.doc)) {
              deleted.push(result.doc.id)
            } else {
              documents.push(result.doc)
            }
          })
          dispatch(actions.upsertBuckets({ documents, deleted }))
        },
        complete: resolve,
        error: reject,
      })
    })
    log.details(`${task} done: ${lastUpdate}`)
  }
}

/**
 * Returns a action creator that creates a async thunk action to push a bucket document.
 *
 * The thunk action returns a promise that resolves when the action is completed.
 *
 * @param operation the operation to log
 * @param sliceName the name of the slice
 * @param actions access to the sync bucket actions of the slice
 * @param prepare a function to convert the domain specific payload to the generic action payload
 * @returns the action creator
 */
export function createPushBucketDocument<T extends BucketStructure, P>(
  operation: string,
  { sliceName, actions }: ThunkContext<T>,
  prepare: (payload: P) => { document: T['bucket'] },
): ThunkActionCreatorWithPayload<P> {
  const collectionPath: CollectionPath = { bucket: sliceName }
  return (payload) => async (dispatch, _, extra) => {
    const { thunkLogs, database } = extra
    const log = thunkLogs[sliceName]

    const { document } = prepare(payload)
    const task = `${operation} ${sliceName}/${document.id}: `

    log.details(task, document)
    const result = await database.putDoc(collectionPath, document)
    log.details(task, result.lastUpdate)

    dispatch(actions.upsertBuckets(isDeleted(result.doc) ? { deleted: [result.doc.id] } : { documents: [result.doc] }))
  }
}

/**
 * Returns a action creator that creates a async thunk action to refresh all collection documents of a bucket.
 *
 * @param sliceName the name of the slice
 * @param actions access to the sync collection actions of the slice
 * @param prepare a function to convert the domain specific payload to the generic action payload
 * @returns the action creator
 */
export function createRefreshCollectionDocuments<T extends BucketStructure, CN extends keyof T['collections'], P>(
  { sliceName, actions }: ThunkContext<T>,
  prepare: (payload: P) => { bucketId: ID; collectionName: CN & CollectionName },
): ThunkActionCreatorWithPayload<P> {
  return (payload: P) => async (dispatch, _, extra) => {
    const { thunkLogs, database } = extra
    const log = thunkLogs[sliceName]

    const { bucketId, collectionName } = prepare(payload)
    const collectionPath: CollectionPath = { bucket: sliceName, bucketId, collection: collectionName }

    const task = `refresh: ${sliceName}/${bucketId}/${collectionName}`
    log.details(task)

    let lastUpdate: number | undefined
    await new Promise<void>((resolve, reject) => {
      database.getDocs(collectionPath).subscribe({
        next: (results) => {
          const documents: Doc[] = []
          const deleted: ID[] = []
          results.forEach((result) => {
            log.details(`${task}/${result.doc.id}: `, result.lastUpdate)
            lastUpdate = result.lastUpdate
            if (isDeleted(result.doc)) {
              deleted.push(result.doc.id)
            } else {
              documents.push(result.doc)
            }
          })
          dispatch(actions.upsertCollection({ bucketId, collectionName, documents, deleted }))
        },
        complete: resolve,
        error: reject,
      })
    })
    log.details(`${task} done: ${lastUpdate}`)
  }
}

/**
 * Returns a action creator that creates a async thunk action to add a new collection document.
 *
 * @param operation the operation to log
 * @param sliceName the name of the slice
 * @param actions access to the sync collection actions of the slice
 * @param prepare a function to convert the domain specific payload to the generic action payload
 * @returns the action creator
 */
export function createPushCollectionDocument<T extends BucketStructure, CN extends keyof T['collections'], P>(
  operation: string,
  { sliceName, actions }: ThunkContext<T>,
  prepare: (payload: P) => { bucketId: ID; collectionName: CN & CollectionName; document: T['collections'][CN] },
): ThunkActionCreatorWithPayload<P> {
  return (payload) => async (dispatch, _, extra) => {
    const { thunkLogs, database } = extra
    const log = thunkLogs[sliceName]

    const { bucketId, collectionName, document } = prepare(payload)
    const collectionPath: CollectionPath = { bucket: sliceName, bucketId, collection: collectionName }
    const task = `${operation} ${sliceName}/${document.id}: `

    log.details(task, document)
    const result = await database.putDoc(collectionPath, document)
    log.details(task, result.lastUpdate)

    dispatch(
      actions.upsertCollection(
        isDeleted(result.doc)
          ? { bucketId, collectionName, deleted: [result.doc.id] }
          : { bucketId, collectionName, documents: [result.doc] },
      ),
    )
  }
}

function isDeleted(doc: Doc): boolean | undefined {
  // eslint-disable-next-line no-underscore-dangle
  return doc.__deleted
}
