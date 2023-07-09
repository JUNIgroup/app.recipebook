import { PayloadAction, Reducer } from '@reduxjs/toolkit'
import { BucketName, BucketStructure, ID } from '../database/database-types'
import { BucketsState } from './types'

/**
 * Action creators functions.
 */
export type BucketsActionCreator<T extends BucketStructure> = {
  /**
   * Calling this redux#ActionCreator will return the "upsertBucket" redux#Action with the given document as payload.
   *
   * The "upsertBucket" action will create a new bucket, if necessary and set the given bucket document.
   * - If the bucket id already exists, the action will update the bucket document of an existing bucket.
   * - If the bucket id does not exist, the action will create a new bucket and set the given bucket document.
   *
   * The `lastUpdate` timestamp should only be set if it can be ensured that all updates of the buckets
   * have already been submitted up to this point. This usually only applies to the refresh operation.
   *
   * @param documents the documents of the buckets to insert or update
   * @param deleted the ids of the buckets to delete
   * @param lastUpdate the last update timestamp of the bucket documents
   * @returns the "upsertBucket" redux#Action with the given document as payload
   */
  upsertBuckets: <Payload = { documents: T['bucket'][]; deleted: ID[]; lastUpdate?: number }>(
    payload: Payload,
  ) => PayloadAction<Payload>

  /**
   * Calling this redux#ActionCreator will return the "upsertCollection" redux#Action with the given documents as payload.
   *
   * The "upsertCollection" action will create a new collection, if necessary and insert or update the given collection documents.
   *
   * The `lastUpdate` timestamp should only be set if it can be ensured that all updates of the collection documents
   * have already been submitted up to this point. This usually only applies to the refresh operation.
   *
   * @param bucketId the id of the bucket, which collection should be updated
   * @param collectionName the name of the collection to update
   * @param documents the collection documents to insert or update
   * @param deleted the ids of the collection documents to delete
   * @param lastUpdate the last update timestamp of the collection documents
   * @returns the "upsertCollection" redux#Action with the given documents as payload
   */
  upsertCollection: <
    CN extends keyof T['collections'],
    Payload = {
      bucketId: ID
      collectionName: CN
      documents: T['collections'][CN][]
      deleted: ID[]
      lastUpdate?: number
    },
  >(
    payload: Payload,
  ) => PayloadAction<Payload>

  /**
   * Calling this redux#ActionCreator will return the "clear" redux#Action without payload.
   *
   * The "clear" action will remove all buckets and collections.
   */
  clear(): PayloadAction<void>
}

export type BucketsSlice<BN extends BucketName, T extends BucketStructure> = {
  /**
   * The name of the slice.
   *
   * It's used as the name of the slice in the redux store.
   * It's also used as prefix for the action types.
   */
  readonly sliceName: BN

  /**
   * Provides access to the initial state value given to the slice.
   *
   * @returns the initial state value of the buckets slice.
   */
  getInitialState: () => BucketsState<T>

  /**
   * The reducer function of the buckets slice.
   */
  readonly reducer: Reducer<BucketsState<T>>

  /**
   * Action creators.
   */
  readonly actions: BucketsActionCreator<T>
}
