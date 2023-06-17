/* eslint-disable no-param-reassign */

import { ActionCreatorWithPayload, PayloadAction, createAction, createSlice } from '@reduxjs/toolkit'
import { WritableDraft, castDraft } from '../../../../utilities/redux/draft'
import { BucketName, BucketStructure, CollectionName, Doc, ID } from '../../database/database-types'
import { BucketsSlice, CollectionActionCreator } from './slice.types'
import { BucketCollectionState, BucketsState, OnActionError } from './types'

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
export function createBucketSlice<BN extends BucketName, T extends BucketStructure>(
  sliceName: BN,
  options: BucketSliceOptions<T>,
): BucketsSlice<BN, T> {
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
      const actionsForCollection: CollectionActionCreator<BN, T, CN> = {
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
