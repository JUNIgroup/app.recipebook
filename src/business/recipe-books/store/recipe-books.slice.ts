/* eslint-disable no-param-reassign */

import { actionError } from '../../helper/redux/redux-action-helper'
import { Recipe, RecipeBook } from '../model'
import { fullRecipe, fullRecipeBook } from '../model/recipe-books.samples'
import { createBucketSlice } from './builder/slice'
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

const bucketSlice = createBucketSlice('recipeBooks', {
  onActionError: (action, error) => actionError(action, error),
  initialState,
})

const { reducer, bucketActions, collectionActions } = bucketSlice
const { addBucket, updateBucketDocument, deleteBucket } = bucketActions
const recipeActions = collectionActions('recipes')

const actions = {
  addRecipeBook: addBucket,
  updateRecipeBook: updateBucketDocument,
  deleteRecipeBook: deleteBucket,
  addRecipe: recipeActions.addCollectionDocument,
  updateRecipe: recipeActions.updateCollectionDocument,
  deleteRecipe: recipeActions.deleteCollectionDocument,
}

// Extract the action creators object and the reducer
export { reducer, actions }
