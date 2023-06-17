/* eslint-disable no-param-reassign */

import { PayloadAction, Reducer } from '@reduxjs/toolkit'
import { BucketName, BucketStructure, CollectionName, ID } from '../../database/database-types'
import { BucketsState } from './types'

/**
 * Action creators for the types of actions which act directly on buckets and bucket document.
 */
export type BucketActionCreator<T extends BucketStructure> = {
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
  addBucket: (payload: { document: T['bucket'] }) => PayloadAction<{ document: T['bucket'] }>

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
  updateBucketDocument: (payload: { document: T['bucket'] }) => PayloadAction<{ document: T['bucket'] }>

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
  deleteBucket: (payload: { bucketId: ID }) => PayloadAction<{ bucketId: ID }>

  /**
   * Calling this redux#ActionCreator will return the "clear" redux#Action without payload.
   *
   * The "clear" action will remove all buckets and collections.
   */
  clear(): PayloadAction<void>
}

/**
 * Action creators for the types of actions which act directly on bucket collections and their documents.
 */
export type CollectionActionCreator<
  BN extends BucketName,
  T extends BucketStructure,
  CN extends keyof T['collections'],
> = {
  /**
   * Calling this redux#ActionCreator will return the "addCollectionDocument" redux#Action with the given document as payload.
   *
   * The "addCollectionDocument" action will add a new document to the collection of the given bucket.
   *
   * If the document id already exists in that collection, the action will be ignored.
   *
   * @param bucketId the id of the bucket, which collection should be updated
   * @param document the collection document
   * @returns the "addCollectionDocument" redux#Action with the given document as payload
   */
  addCollectionDocument: (payload: { bucketId: ID; document: T['collections'][CN] }) => PayloadAction<
    {
      bucketId: ID
      collectionName: CN
      document: T['collections'][CN]
    },
    `${BN}/addCollectionDocument`
  >

  /**
   * Calling this redux#ActionCreator will return the "updateCollectionDocument" redux#Action with the given document as payload.
   *
   * The "updateCollectionDocument" action will update an existing collection document.
   *
   * If the document id does not exist in that collection, the action will be ignored.
   *
   * @param bucketId the id of the bucket, which collection should be updated
   * @param document the new collection document
   * @returns the "updateCollectionDocument" redux#Action with the given document as payload
   */
  updateCollectionDocument: (payload: { bucketId: ID; document: T['collections'][CN] }) => PayloadAction<
    {
      bucketId: ID
      collectionName: CN
      document: T['collections'][CN]
    },
    `${BN}/updateCollectionDocument`
  >

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
  deleteCollectionDocument: (payload: { bucketId: ID; id: ID }) => PayloadAction<
    {
      bucketId: ID
      collectionName: CN
      id: ID
    },
    `${BN}/deleteCollectionDocument`
  >
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
   * Action creators for the types of actions that act directly on buckets and bucket document.
   */
  readonly bucketActions: BucketActionCreator<T>

  /**
   * A factory for the action creators of the given collection.
   */
  collectionActions<CN extends keyof T['collections'] & CollectionName>(
    collectionName: CN,
  ): CollectionActionCreator<BN, T, CN>
}
