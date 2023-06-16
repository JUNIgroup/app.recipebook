/* eslint-disable no-param-reassign */

import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { actionError } from '../../helper/redux/redux-action-helper'
import { Recipe, RecipeBook } from '../model'
import { fullRecipe, fullRecipeBook } from '../model/recipe-books.samples'
import { BucketsState } from './builder/types'

export type RecipeBookStructure = {
  bucket: RecipeBook
  collections: {
    recipes: Recipe
  }
}

export type RecipeBooksState = BucketsState<RecipeBookStructure>

const initialState: RecipeBooksState = {
  ids: [fullRecipeBook.id],
  buckets: {
    [fullRecipeBook.id]: {
      entity: fullRecipeBook,
      collections: {
        recipes: {
          ids: [fullRecipe.id],
          entities: { [fullRecipe.id]: fullRecipe },
        },
      },
    },
  },
}

const bucketSlice = createSlice({
  name: 'recipeBooks',
  initialState,
  reducers: {
    /**
     * Add a bucket document.
     */
    addBucketDocument(state, action: PayloadAction<{ document: RecipeBook }>) {
      const { document } = action.payload
      const { id } = document

      if (state.buckets[id]) {
        actionError(action, 'document id already used')
        return
      }

      state.ids.push(id)
      state.buckets[id] = {
        entity: document,
        collections: {
          recipes: {
            ids: [],
            entities: {},
          },
        },
      }
    },

    /**
     * Update a bucket document.
     */
    updateBucketDocument(state, action: PayloadAction<{ document: RecipeBook }>) {
      const { document } = action.payload
      const { id } = document

      const bucket = state.buckets[id]
      if (!bucket) {
        actionError(action, 'bucket id is unknown')
        return
      }

      bucket.entity = document
    },

    /**
     * Delete a bucket document and all its references.
     */
    deleteBucketDocument(state, action: PayloadAction<{ bucketId: string }>) {
      const { bucketId: id } = action.payload

      const bucket = state.buckets[id]
      if (!bucket) {
        actionError(action, 'bucket id is unknown')
        return
      }

      state.ids.splice(state.ids.indexOf(id), 1)
      delete state.buckets[id]
    },

    /**
     * Add or update a bucket document.
     */
    addCollectionDocument(
      state,
      action: PayloadAction<{
        bucketId: string
        collection: 'recipes'
        document: Recipe
      }>,
    ) {
      const { bucketId, collection: collectionName, document } = action.payload
      const { id } = document

      const bucket = state.buckets[bucketId]
      if (!bucket) {
        actionError(action, 'bucket id is unknown')
        return
      }

      const collection = bucket.collections[collectionName]
      if (collection.entities[id]) {
        actionError(action, 'document id already used')
        return
      }

      collection.entities[id] = document
      collection.ids.push(id)
    },

    /**
     * update a bucket document.
     */
    updateCollectionDocument(
      state,
      action: PayloadAction<{
        bucketId: string
        collection: 'recipes'
        document: Recipe
      }>,
    ) {
      const { bucketId, collection: collectionName, document } = action.payload
      const { id } = document

      const bucket = state.buckets[bucketId]
      if (!bucket) {
        actionError(action, 'bucket id is unknown')
        return
      }

      const collection = bucket.collections[collectionName]
      if (!collection.entities[id]) {
        actionError(action, 'document id is unknown')
        return
      }

      collection.entities[id] = document
    },

    /**
     * Delete a bucket document and all its references.
     */
    deleteCollectionDocument(
      state,
      action: PayloadAction<{
        bucketId: string
        collection: 'recipes'
        id: string
      }>,
    ) {
      const { bucketId, collection: collectionName, id } = action.payload

      const bucket = state.buckets[bucketId]
      if (!bucket) {
        actionError(action, 'bucket id is unknown')
        return
      }

      const collection = bucket.collections[collectionName]
      if (!collection.entities[id]) {
        actionError(action, 'document id is unknown')
        return
      }

      collection.ids.splice(collection.ids.indexOf(id), 1)
      delete collection.entities[id]
    },

    /**
     * Clear all buckets and their references.
     */
    clearAll(state) {
      state.ids = []
      state.buckets = {}
    },
  },
})

// Extract the action creators object and the reducer
export const { actions, reducer } = bucketSlice
