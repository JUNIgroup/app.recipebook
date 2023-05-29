/* eslint-disable no-param-reassign */

import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { actionError } from '../../helper/redux/redux-action-helper'
import { Recipe, RecipeBook } from '../model'
import { fullRecipe, fullRecipeBook } from '../model/recipe-books.samples'

export type RecipeBookBucketsState = {
  recipeBooks: {
    ids: string[]
    entities: Record<string, RecipeBook>
  }
  recipes: {
    ids: string[]
    entities: Record<string, Recipe>
  }
}

const initialState: RecipeBookBucketsState = {
  recipeBooks: {
    ids: [fullRecipeBook.id],
    entities: { [fullRecipeBook.id]: fullRecipeBook },
  },
  recipes: {
    ids: [fullRecipe.id],
    entities: { [fullRecipe.id]: fullRecipe },
  },
}

const bucketSlice = createSlice({
  name: 'recipeBooks',
  initialState,
  reducers: {
    /**
     * Add or update a bucket document.
     */
    setBucketDocument(state, action: PayloadAction<{ document: RecipeBook }>) {
      const { document } = action.payload
      const { id } = document

      const isNew = !state.recipeBooks.entities[id]
      if (isNew) state.recipeBooks.ids.push(id)

      state.recipeBooks.entities[id] = document
    },

    /**
     * Delete a bucket document and all its references.
     */
    deleteBucketDocument(state, action: PayloadAction<{ id: string }>) {
      const { id } = action.payload

      const bucket = state.recipeBooks.entities[id]
      if (!bucket) {
        actionError(action, 'id is unknown')
        return
      }

      // delete references not implemented yet

      state.recipeBooks.ids.splice(state.recipeBooks.ids.indexOf(id), 1)
      delete state.recipeBooks.entities[id]
    },

    /**
     * Clear all buckets and their references.
     */
    clearAll(state) {
      state.recipeBooks.ids = []
      state.recipeBooks.entities = {}
      state.recipes.ids = []
      state.recipes.entities = {}
    },
  },
})

// Extract the action creators object and the reducer
export const { actions, reducer } = bucketSlice
