/* eslint-disable no-param-reassign */

import { actionError } from '../../helper/redux/redux-action-helper'
import { Recipe, RecipeBook } from '../model'
import { fullRecipe, fullRecipeBook } from '../model/recipe-books.samples'
import { createBucketsSlice } from '../../data-store.builder/slice'
import { BucketsState } from '../../data-store.builder/types'

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

const bucketSlice = createBucketsSlice('recipeBooks', {
  onActionError: (action, error) => actionError(action, error),
  initialState,
})

export const { sliceName, reducer, actions } = bucketSlice
