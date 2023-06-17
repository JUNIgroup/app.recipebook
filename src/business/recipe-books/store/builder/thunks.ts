import { AnyAction, ThunkAction } from '@reduxjs/toolkit'
import { BucketStructure, ID } from '../../database/database-types'
import { BucketsActionCreator } from './slice.types'

type Services = Record<string, unknown>

type ThunkActionCreator<R = Promise<void>> = () => ThunkAction<R, unknown, Services, AnyAction>

type ThunkActionCreatorWithPayload<P, R = Promise<void>> = (payload: P) => ThunkAction<R, unknown, Services, AnyAction>

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
export function createRefreshBucketDocuments<T extends BucketStructure>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  actions: BucketsActionCreator<T>,
): ThunkActionCreator {
  return () => async () => {
    // not implemented yet
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
  actions: BucketsActionCreator<T>,
  prepare: (payload: P) => { document: T['bucket'] },
): ThunkActionCreatorWithPayload<P> {
  return (payload) => async (dispatch) => {
    dispatch(actions.addBucket(prepare(payload)))
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
  actions: BucketsActionCreator<T>,
  prepare: (payload: P) => { document: T['bucket'] },
): ThunkActionCreatorWithPayload<P> {
  return (payload) => async (dispatch) => {
    dispatch(actions.updateBucketDocument(prepare(payload)))
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
  actions: BucketsActionCreator<T>,
  prepare: (payload: P) => { bucketId: ID },
): ThunkActionCreatorWithPayload<P> {
  return (payload) => async (dispatch) => {
    dispatch(actions.deleteBucket(prepare(payload)))
  }
}

/**
 * Returns a action creator that creates a async thunk action to refresh all collection documents of a bucket.
 *
 * @param actions access to the sync collection actions of the slice
 * @param prepare a function to convert the domain specific payload to the generic action payload
 * @returns the action creator
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function createRefreshCollectionDocuments<T extends BucketStructure, CN extends keyof T['collections'], P>(
  actions: BucketsActionCreator<T>,
  prepare: (payload: P) => { bucketId: ID },
): ThunkActionCreatorWithPayload<P> {
  return (payload: P) => async () => {
    // not implemented yet
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Returns a action creator that creates a async thunk action to add a new collection document.
 *
 * @param actions access to the sync collection actions of the slice
 * @param prepare a function to convert the domain specific payload to the generic action payload
 * @returns the action creator
 */
export function createAddCollectionDocument<T extends BucketStructure, CN extends keyof T['collections'], P>(
  actions: BucketsActionCreator<T>,
  prepare: (payload: P) => { bucketId: ID; collectionName: CN; document: T['collections'][CN] },
): ThunkActionCreatorWithPayload<P> {
  return (payload) => async (dispatch) => {
    dispatch(actions.addCollectionDocument(prepare(payload)))
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
  actions: BucketsActionCreator<T>,
  prepare: (payload: P) => { bucketId: ID; collectionName: CN; document: T['collections'][CN] },
): ThunkActionCreatorWithPayload<P> {
  return (payload) => async (dispatch) => {
    dispatch(actions.updateCollectionDocument(prepare(payload)))
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
  actions: BucketsActionCreator<T>,
  prepare: (payload: P) => { bucketId: ID; collectionName: CN; id: ID },
): ThunkActionCreatorWithPayload<P> {
  return (payload) => async (dispatch) => {
    dispatch(actions.deleteCollectionDocument(prepare(payload)))
  }
}
