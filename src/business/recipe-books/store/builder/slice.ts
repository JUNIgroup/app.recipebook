/* eslint-disable no-param-reassign */

import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { WritableDraft, castDraft } from '../../../../utilities/redux/draft'
import { BucketName, BucketStructure, ID } from '../../database/database-types'
import { BucketsActionCreator, BucketsSlice } from './slice.types'
import { BucketCollectionState, BucketsState, OnActionError } from './types'

export type BucketsSliceOptions<T extends BucketStructure> = {
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
export function createBucketsSlice<BN extends BucketName, T extends BucketStructure>(
  sliceName: BN,
  options: BucketsSliceOptions<T>,
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

      upsertBuckets(state, action: PayloadAction<{ documents: T['bucket'][] }>) {
        function upsert(document: T['bucket']) {
          const { id } = document
          if (state.buckets[id]) {
            state.buckets[id].entity = castDraft(document)
          } else {
            state.ids.push(id)
            state.buckets[id] = castDraft({
              entity: document,
              collections: {},
            })
          }
        }
        action.payload.documents.forEach(upsert)
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

      addCollectionDocument<CN extends keyof T['collections']>(
        state: WritableDraft<State>,
        action: PayloadAction<{ bucketId: ID; collectionName: CN; document: T['collections'][CN] }>,
      ) {
        const { bucketId, collectionName, document } = action.payload
        const { id } = document

        if (!state.buckets[bucketId]) {
          onActionError(action, `bucket id '${bucketId}' does not exist`)
          return
        }

        const collections = state.buckets[bucketId].collections as Record<
          CN,
          WritableDraft<BucketCollectionState<T['collections'][CN]>>
        >
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

      updateCollectionDocument<CN extends keyof T['collections']>(
        state: WritableDraft<State>,
        action: PayloadAction<{ bucketId: ID; collectionName: CN; document: T['collections'][CN] }>,
      ) {
        const { bucketId, collectionName, document } = action.payload
        const { id } = document

        if (!state.buckets[bucketId]) {
          onActionError(action, `bucket id '${bucketId}' does not exist`)
          return
        }

        const collections = state.buckets[bucketId].collections as Record<
          CN,
          WritableDraft<BucketCollectionState<T['collections'][CN]>>
        >
        const collection = collections[collectionName]
        if (collection == null || !collection.entities[id]) {
          onActionError(action, `document id '${id}' does not exist`)
          return
        }

        collection.entities[id] = castDraft(document)
      },

      upsertCollection<CN extends keyof T['collections']>(
        state: WritableDraft<State>,
        action: PayloadAction<{ bucketId: ID; collectionName: CN; documents: T['collections'][CN][] }>,
      ) {
        const { bucketId, collectionName, documents } = action.payload

        if (!state.buckets[bucketId]) {
          onActionError(action, `bucket id '${bucketId}' does not exist`)
          return
        }

        if (documents.length === 0) return

        const collections = state.buckets[bucketId].collections as Record<
          CN,
          WritableDraft<BucketCollectionState<T['collections'][CN]>>
        >
        let collection = collections[collectionName]
        if (collection == null) {
          collection = castDraft({
            ids: [],
            entities: {},
          })
          collections[collectionName] = collection
        }

        function upsert(document: T['collections'][CN]) {
          const { id } = document
          if (collection.entities[id]) {
            collection.entities[id] = castDraft(document)
          } else {
            collection.ids.push(id)
            collection.entities[id] = castDraft(document)
          }
        }
        documents.forEach(upsert)
      },

      deleteCollectionDocument<CN extends keyof T['collections']>(
        state: WritableDraft<State>,
        action: PayloadAction<{ bucketId: ID; collectionName: CN; id: ID }>,
      ) {
        const { bucketId, collectionName, id } = action.payload

        if (!state.buckets[bucketId]) {
          onActionError(action, `bucket id '${bucketId}' does not exist`)
          return
        }

        const collections = state.buckets[bucketId].collections as Record<
          CN,
          WritableDraft<BucketCollectionState<never>>
        >
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
  return { name: sliceName, getInitialState, reducer, actions: actions as BucketsActionCreator<T> }
}
