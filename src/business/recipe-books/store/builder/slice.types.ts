import { PayloadAction, Reducer } from '@reduxjs/toolkit'
import { BucketName, BucketStructure, ID } from '../../database/database-types'
import { BucketsState } from './types'

/**
 * Action creators functions.
 */
export type BucketsActionCreator<T extends BucketStructure> = {
  /**
   * Calling this redux#ActionCreator will return the "addBucket" redux#Action with the given document as payload.
   *
   * The "addBucket" action will add a new bucket and set the given bucket document.
   *
   * If the bucket id already exists, the action will be ignored.
   *
   * @param document the bucket document
   * @returns the "addBucket" redux#Action with the given document as payload
   */
  addBucket: <Payload = { document: T['bucket'] }>(payload: Payload) => PayloadAction<Payload>

  /**
   * Calling this redux#ActionCreator will return the "updateBucketDocument" redux#Action with the given document as payload.
   *
   * The "updateBucketDocument" action will update the bucket document of an existing bucket.
   *
   * If the bucket id does not exist, the action will be ignored.
   *
   * @param document the new bucket document
   * @returns the "updateBucketDocument" redux#Action with the given document as payload
   */
  updateBucketDocument: <Payload = { document: T['bucket'] }>(payload: Payload) => PayloadAction<Payload>

  /**
   * Calling this redux#ActionCreator will return the "upsertBucket" redux#Action with the given document as payload.
   *
   * The "upsertBucket" action will create a new bucket, if necessary and set the given bucket document.
   * - If the bucket id already exists, the action will update the bucket document of an existing bucket.
   * - If the bucket id does not exist, the action will create a new bucket and set the given bucket document.
   *
   * @param payload the bucket document to set, includes the bucket id
   * @returns the "upsertBucket" redux#Action with the given document as payload
   */
  upsertBuckets: <Payload = { documents: T['bucket'][] }>(payload: Payload) => PayloadAction<Payload>

  /**
   * Calling this redux#ActionCreator will return the "deleteBucket" redux#Action with the given id as payload.
   *
   * The "deleteBucket" action will remove the bucket include the bucket document and all collections.
   *
   * If the bucket id does not exist, the action will be ignored.
   *
   * @param bucketId the id of the bucket to delete
   * @returns the "deleteBucket" redux#Action with the given id as payload
   */
  deleteBucket: <Payload = { bucketId: ID }>(payload: Payload) => PayloadAction<Payload>

  /**
   * Calling this redux#ActionCreator will return the "addCollectionDocument" redux#Action with the given document as payload.
   *
   * The "addCollectionDocument" action will add a new document to the collection of the given bucket.
   *
   * If the document id already exists in that collection, the action will be ignored.
   *
   * @param bucketId the id of the bucket, which collection should be updated
   * @param collectionName the name of the collection to update
   * @param document the collection document
   * @returns the "addCollectionDocument" redux#Action with the given document as payload
   */
  addCollectionDocument: <
    CN extends keyof T['collections'],
    Payload = { bucketId: ID; collectionName: CN; document: T['collections'][CN] },
  >(
    payload: Payload,
  ) => PayloadAction<Payload>

  /**
   * Calling this redux#ActionCreator will return the "updateCollectionDocument" redux#Action with the given document as payload.
   *
   * The "updateCollectionDocument" action will update an existing collection document.
   *
   * If the document id does not exist in that collection, the action will be ignored.
   *
   * @param bucketId the id of the bucket, which collection should be updated
   * @param collectionName the name of the collection to update
   * @param document the new collection document
   * @returns the "updateCollectionDocument" redux#Action with the given document as payload
   */
  updateCollectionDocument: <
    CN extends keyof T['collections'],
    Payload = { bucketId: ID; collectionName: CN; document: T['collections'][CN] },
  >(
    payload: Payload,
  ) => PayloadAction<Payload>

  /**
   * Calling this redux#ActionCreator will return the "upsertCollection" redux#Action with the given documents as payload.
   *
   * The "upsertCollection" action will create a new collection, if necessary and insert or update the given collection documents.
   *
   * @param bucketId the id of the bucket, which collection should be updated
   * @param collectionName the name of the collection to update
   * @param documents the collection documents to insert or update
   * @returns the "upsertCollection" redux#Action with the given documents as payload
   */
  upsertCollection: <
    CN extends keyof T['collections'],
    Payload = { bucketId: ID; collectionName: CN; documents: T['collections'][CN][] },
  >(
    payload: Payload,
  ) => PayloadAction<Payload>

  /**
   * Calling this redux#ActionCreator will return the "deleteCollectionDocument" redux#Action with the given id as payload.
   *
   * The "deleteCollectionDocument" action will remove the document from the collection of the given bucket.
   *
   * If the document id does not exist in that collection, the action will be ignored.
   *
   * @param bucketId the id of the bucket, which collection should be updated
   * @param id the id of the document to delete
   * @returns the "deleteCollectionDocument" redux#Action with the given id as payload
   */
  deleteCollectionDocument: <CN extends keyof T['collections'], Payload = { bucketId: ID; collectionName: CN; id: ID }>(
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
  readonly name: BN

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
