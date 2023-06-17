/* eslint-disable no-param-reassign */

import { Action, ActionCreatorWithPayload, PayloadAction, Reducer, createAction, createSlice } from '@reduxjs/toolkit'
import { WritableDraft, castDraft } from '../../../../utilities/redux/draft'
import { BucketName, BucketStructure, Doc, ID, CollectionName } from '../../database/database-types'
import { BucketCollectionState, BucketsState } from './types'

export type OnActionError = (action: Action, message: string) => void

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
  T extends BucketStructure,
  BN extends BucketName,
  CN extends keyof T['collections'] & CollectionName,
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

export type BucketsSlice<T extends BucketStructure, BN extends BucketName> = {
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
  ): CollectionActionCreator<T, BN, CN>
}

export type BucketSliceOptions<T extends BucketStructure> = {
  /**
   * A callback that is called, if an action is ignored because of an error.
   */
  onActionError: OnActionError

  /**
   * The initial state value of the buckets slice.
   *
   * @default { ids: [], buckets: {} }
   */
  initialState?: BucketsState<T>
}

/**
 * Creates a new buckets slice with bucket and collection actions.
 *
 * @param sliceName the name of the slice
 * @param options additional options
 * @returns a new buckets slice
 */
export function createBucketSlice<T extends BucketStructure, BN extends BucketName>(
  sliceName: BN,
  options: BucketSliceOptions<T>,
): BucketsSlice<T, BN> {
  type State = BucketsState<T>

  const { onActionError, initialState = { ids: [], buckets: {} } } = options

  const slice = createSlice({
    name: sliceName,
    initialState,
    reducers: {
      addBucket(state, action: PayloadAction<{ document: T['bucket'] }>) {
        const { document } = action.payload
        const { id } = document

        if (state.buckets[id]) {
          onActionError(action, `document id '${id}' already used`)
          return
        }

        state.ids.push(id)
        state.buckets[id] = castDraft({
          entity: document,
          collections: {},
        })
      },

      updateBucketDocument(state, action: PayloadAction<{ document: T['bucket'] }>) {
        const { document } = action.payload
        const { id } = document

        if (!state.buckets[id]) {
          onActionError(action, `document id '${id}' does not exist`)
          return
        }

        state.buckets[id].entity = castDraft(document)
      },

      deleteBucket(state, action: PayloadAction<{ bucketId: ID }>) {
        const { bucketId } = action.payload

        if (!state.buckets[bucketId]) {
          onActionError(action, `document id '${bucketId}' does not exist`)
          return
        }

        state.ids = state.ids.filter((i) => i !== bucketId)
        delete state.buckets[bucketId]
      },

      addCollectionDocument<CN extends keyof T['collections'], D extends T['collections'][CN]>(
        state: WritableDraft<State>,
        action: PayloadAction<{ bucketId: ID; collectionName: CN; document: D }>,
      ) {
        const { bucketId, collectionName, document } = action.payload
        const { id } = document

        if (!state.buckets[bucketId]) {
          onActionError(action, `bucket id '${bucketId}' does not exist`)
          return
        }

        const collections = state.buckets[bucketId].collections as Record<CN, WritableDraft<BucketCollectionState<D>>>
        const collection = collections[collectionName]
        if (collection == null) {
          collections[collectionName] = castDraft({
            ids: [id],
            entities: { [id]: document },
          })
          return
        }

        if (collection.entities[id]) {
          onActionError(action, `document id '${id}' already used`)
          return
        }

        collection.ids.push(id)
        collection.entities[id] = castDraft(document)
      },

      updateCollectionDocument<CN extends keyof T['collections'], D extends Doc>(
        state: WritableDraft<State>,
        action: PayloadAction<{ bucketId: ID; collectionName: CN; document: D }>,
      ) {
        const { bucketId, collectionName, document } = action.payload
        const { id } = document

        if (!state.buckets[bucketId]) {
          onActionError(action, `bucket id '${bucketId}' does not exist`)
          return
        }

        const collections = state.buckets[bucketId].collections as Record<CN, WritableDraft<BucketCollectionState<D>>>
        const collection = collections[collectionName]
        if (collection == null || !collection.entities[id]) {
          onActionError(action, `document id '${id}' does not exist`)
          return
        }

        collection.entities[id] = castDraft(document)
      },

      deleteCollectionDocument<CN extends keyof T['collections'], D extends Doc>(
        state: WritableDraft<State>,
        action: PayloadAction<{ bucketId: ID; collectionName: CN; id: ID }>,
      ) {
        const { bucketId, collectionName, id } = action.payload

        if (!state.buckets[bucketId]) {
          onActionError(action, `bucket id '${bucketId}' does not exist`)
          return
        }

        const collections = state.buckets[bucketId].collections as Record<CN, WritableDraft<BucketCollectionState<D>>>
        const collection = collections[collectionName]
        if (collection == null || !collection.entities[id]) {
          onActionError(action, `document id '${id}' does not exist`)
          return
        }

        collection.ids = collection.ids.filter((i) => i !== id)
        delete collection.entities[id]
      },

      clear(state) {
        if (state.ids.length === 0) return

        state.ids = []
        state.buckets = {}
      },
    },
  })

  const { getInitialState, reducer, actions } = slice
  const { addCollectionDocument, updateCollectionDocument, deleteCollectionDocument, ...bucketActions } = actions
  return {
    name: sliceName,
    getInitialState,
    reducer,
    bucketActions,
    collectionActions<CN extends keyof T['collections'] & CollectionName>(collectionName: CN) {
      const actionsForCollection: CollectionActionCreator<T, BN, CN> = {
        addCollectionDocument: withCollectionName(collectionName, addCollectionDocument),
        updateCollectionDocument: withCollectionName(collectionName, updateCollectionDocument),
        deleteCollectionDocument: withCollectionName(collectionName, deleteCollectionDocument),
      }
      return actionsForCollection
    },
  }
}

function withCollectionName<
  T extends string,
  CN extends string,
  P extends { collectionName: CN },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  A extends ActionCreatorWithPayload<any, T>,
>(collectionName: CN, actionCreator: A) {
  type PA = (payload: Omit<P, 'collectionName'>) => { payload: P }
  return createAction<PA, T>(actionCreator.type, (payload) => ({ payload: { ...payload, collectionName } as P }))
}
