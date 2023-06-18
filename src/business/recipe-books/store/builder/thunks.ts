import { AnyAction, ThunkAction } from '@reduxjs/toolkit'
import { Log } from '../../../../utilities/logger'
import { CollectionPath, Database } from '../../database/database'
import { BucketName, BucketStructure, CollectionName, ID } from '../../database/database-types'
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
 * @param _actions access to the sync bucket actions of the slice
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
          results.forEach((result) => log.details(`${task}/${result.doc.id}: `, result.lastUpdate))
          lastUpdate = results[results.length - 1].lastUpdate
          const documents = results.map((result) => result.doc)
          dispatch(actions.upsertBuckets({ documents }))
        },
        complete: resolve,
        error: reject,
      })
    })
    log.details(`${task} done: ${lastUpdate}`)
  }
}

/**
 * Returns a action creator that creates a async thunk action to add a new bucket.
 *
 * The thunk action will add a new bucket and set the given bucket document.
 *
 * The thunk action returns a promise that resolves when the action is completed.
 *
 * @param actions access to the sync bucket actions of the slice
 * @param prepare a function to convert the domain specific payload to the generic action payload
 * @returns the action creator
 */
export function createAddBucket<T extends BucketStructure, P>(
  { sliceName, actions }: ThunkContext<T>,
  prepare: (payload: P) => { document: T['bucket'] },
): ThunkActionCreatorWithPayload<P> {
  const collectionPath: CollectionPath = { bucket: sliceName }
  return (payload) => async (dispatch, _, extra) => {
    const { thunkLogs, database } = extra
    const log = thunkLogs[sliceName]

    const { document } = prepare(payload)
    const task = `add ${sliceName}/${document.id}: `

    log.details(task, document)
    const result = await database.putDoc(collectionPath, document)
    log.details(task, result.lastUpdate)

    dispatch(actions.upsertBuckets({ documents: [result.doc] }))
  }
}

/**
 * Returns a action creator that creates a async thunk action to update a bucket document.
 *
 * The thunk action will update the bucket document of an existing bucket.
 *
 * The thunk action returns a promise that resolves when the action is completed.
 *
 * @param actions access to the sync bucket actions of the slice
 * @param prepare a function to convert the domain specific payload to the generic action payload
 * @returns the action creator
 */
export function createUpdateBucketDocument<T extends BucketStructure, P>(
  { sliceName, actions }: ThunkContext<T>,
  prepare: (payload: P) => { document: T['bucket'] },
): ThunkActionCreatorWithPayload<P> {
  const collectionPath: CollectionPath = { bucket: sliceName }
  return (payload) => async (dispatch, _, extra) => {
    const { thunkLogs, database } = extra
    const log = thunkLogs[sliceName]

    const { document } = prepare(payload)
    const task = `update ${sliceName}/${document.id}: `

    log.details(task, document)
    const result = await database.putDoc(collectionPath, document)
    log.details(task, result.lastUpdate)

    dispatch(actions.upsertBuckets({ documents: [result.doc] }))
  }
}

/**
 * Returns a action creator that creates a async thunk action to delete a bucket.
 *
 * The thunk action will remove the bucket include the bucket document and all collections.
 *
 * The thunk action returns a promise that resolves when the action is completed.
 *
 * @param actions access to the sync bucket actions of the slice
 * @param prepare a function to convert the domain specific payload to the generic action payload
 * @returns the action creator
 */
export function createDeleteBucket<T extends BucketStructure, P>(
  { sliceName, actions }: ThunkContext<T>,
  prepare: (payload: P) => { bucketId: ID },
): ThunkActionCreatorWithPayload<P> {
  const collectionPath: CollectionPath = { bucket: sliceName }
  return (payload) => async (dispatch, _, extra) => {
    const { thunkLogs, database } = extra
    const log = thunkLogs[sliceName]

    const { bucketId } = prepare(payload)
    const task = `delete ${sliceName}/${bucketId}`

    log.details(task)
    await database.delDoc(collectionPath, { id: bucketId, rev: 0 })
    log.details(task)

    dispatch(actions.deleteBucket({ bucketId }))
  }
}

/**
 * Returns a action creator that creates a async thunk action to refresh all collection documents of a bucket.
 *
 * @param actions access to the sync collection actions of the slice
 * @param _prepare a function to convert the domain specific payload to the generic action payload
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

    let lastUpdate: number | undefined // Number.NEGATIVE_INFINITY
    await new Promise<void>((resolve, reject) => {
      database.getDocs(collectionPath).subscribe({
        next: (results) => {
          results.forEach((result) => log.details(`${task}/${result.doc.id}: `, result.lastUpdate))
          lastUpdate = results[results.length - 1].lastUpdate
          const documents = results.map((result) => result.doc)
          dispatch(actions.upsertCollection({ bucketId, collectionName, documents }))
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
 * @param actions access to the sync collection actions of the slice
 * @param prepare a function to convert the domain specific payload to the generic action payload
 * @returns the action creator
 */
export function createAddCollectionDocument<T extends BucketStructure, CN extends keyof T['collections'], P>(
  { sliceName, actions }: ThunkContext<T>,
  prepare: (payload: P) => { bucketId: ID; collectionName: CN & CollectionName; document: T['collections'][CN] },
): ThunkActionCreatorWithPayload<P> {
  return (payload) => async (dispatch, _, extra) => {
    const { thunkLogs, database } = extra
    const log = thunkLogs[sliceName]

    const { bucketId, collectionName, document } = prepare(payload)
    const collectionPath: CollectionPath = { bucket: sliceName, bucketId, collection: collectionName }
    const task = `add ${sliceName}/${document.id}: `

    log.details(task, document)
    const result = await database.putDoc(collectionPath, document)
    log.details(task, result.lastUpdate)

    dispatch(actions.upsertCollection({ bucketId, collectionName, documents: [result.doc] }))
  }
}

/**
 * Returns a action creator that creates a async thunk action to update a collection document.
 *
 * @param actions access to the sync collection actions of the slice
 * @param prepare a function to convert the domain specific payload to the generic action payload
 * @returns the action creator
 */
export function createUpdateCollectionDocument<T extends BucketStructure, CN extends keyof T['collections'], P>(
  { sliceName, actions }: ThunkContext<T>,
  prepare: (payload: P) => { bucketId: ID; collectionName: CN & CollectionName; document: T['collections'][CN] },
): ThunkActionCreatorWithPayload<P> {
  return (payload) => async (dispatch, _, extra) => {
    const { thunkLogs, database } = extra
    const log = thunkLogs[sliceName]

    const { bucketId, collectionName, document } = prepare(payload)
    const collectionPath: CollectionPath = { bucket: sliceName, bucketId, collection: collectionName }
    const task = `update ${sliceName}/${document.id}: `

    log.details(task, document)
    const result = await database.putDoc(collectionPath, document)
    log.details(task, result.lastUpdate)

    dispatch(actions.upsertCollection({ bucketId, collectionName, documents: [result.doc] }))
  }
}

/**
 * Returns a action creator that creates a async thunk action to delete a collection document.
 *
 * @param actions access to the sync collection actions of the slice
 * @param prepare a function to convert the domain specific payload to the generic action payload
 * @returns the action creator
 */
export function createDeleteCollectionDocument<T extends BucketStructure, CN extends keyof T['collections'], P>(
  { sliceName, actions }: ThunkContext<T>,
  prepare: (payload: P) => { bucketId: ID; collectionName: CN & CollectionName; id: ID },
): ThunkActionCreatorWithPayload<P> {
  return (payload) => async (dispatch, _, extra) => {
    const { thunkLogs, database } = extra
    const log = thunkLogs[sliceName]

    const { bucketId, collectionName, id } = prepare(payload)
    const collectionPath: CollectionPath = { bucket: sliceName, bucketId, collection: collectionName }
    const task = `delete ${sliceName}/${bucketId}/${collectionName}/${id}`

    log.details(task)
    await database.delDoc(collectionPath, { id, rev: 0 })
    log.details(task)

    dispatch(actions.deleteCollectionDocument({ bucketId, collectionName, id }))
  }
}
