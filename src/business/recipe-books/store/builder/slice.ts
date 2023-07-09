/* eslint-disable no-param-reassign */

import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { WritableDraft, castDraft } from '../../../../utilities/redux/draft'
import { BucketName, BucketStructure, ID } from '../../../database/database-types'
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
      upsertBuckets(state, action: PayloadAction<{ documents: T['bucket'][]; deleted: ID[]; lastUpdate?: number }>) {
        const { documents = [], deleted = [], lastUpdate } = action.payload

        // insert / update
        documents.forEach((document) => {
          const { id } = document
          if (id in state.buckets) {
            state.buckets[id].entity = castDraft(document)
          } else {
            state.ids.push(id)
            state.buckets[id] = castDraft({
              entity: document,
              collections: {},
            })
          }
        })

        // delete
        const found = deleted.filter((id) => id in state.buckets)
        if (found.length > 0) {
          state.ids = state.ids.filter((id) => !found.includes(id))
          found.forEach((id) => delete state.buckets[id])
        }

        // last update
        if (lastUpdate != null) state.lastUpdate = lastUpdate
      },

      upsertCollection<CN extends keyof T['collections']>(
        state: WritableDraft<State>,
        action: PayloadAction<{
          bucketId: ID
          collectionName: CN
          documents: T['collections'][CN][]
          deleted: ID[]
          lastUpdate?: number
        }>,
      ) {
        const { bucketId, collectionName, documents = [], deleted = [], lastUpdate } = action.payload

        if (!state.buckets[bucketId]) {
          onActionError(action, `bucket id '${bucketId}' does not exist`)
          return
        }

        const collections = state.buckets[bucketId].collections as Record<
          CN,
          WritableDraft<BucketCollectionState<T['collections'][CN]>>
        >
        let collection = collections[collectionName]
        if (documents.length === 0 && lastUpdate == null && (collection == null || collection.ids.length == null))
          return

        if (collection == null) {
          collection = castDraft({
            ids: [],
            entities: {},
          })
          collections[collectionName] = collection
        }

        // insert / update
        documents.forEach((document) => {
          const { id } = document
          if (!(id in collection.entities)) collection.ids.push(id)
          collection.entities[id] = castDraft(document)
        })

        // delete
        const found = deleted.filter((id) => id in collection.entities)
        if (found.length > 0) {
          collection.ids = collection.ids.filter((id) => !found.includes(id))
          found.forEach((id) => delete collection.entities[id])
        }

        // last update
        if (lastUpdate != null) collection.lastUpdate = lastUpdate
      },

      clear(state) {
        if (state.ids.length === 0) return

        state.ids = []
        state.buckets = {}
      },
    },
  })
  const { getInitialState, reducer, actions } = slice
  return { sliceName, getInitialState, reducer, actions: actions as BucketsActionCreator<T> }
}
