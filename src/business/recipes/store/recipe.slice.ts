/* eslint-disable no-param-reassign */

import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { actionError } from '../../helper/redux/redux-action-helper'
import { Recipe } from '../model/recipe.model'

export type RecipesState = {
  ids: string[]
  entities: Record<string, Recipe>
}

const initialState: RecipesState = {
  ids: [],
  entities: {},
}

const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    /** replace all recipes with the given entities. */
    setAllRecipes(state, action: PayloadAction<{ recipes: Recipe[] }>) {
      const { recipes } = action.payload
      const entries = Object.fromEntries(recipes.map((r) => [r.id, r]))
      const ids = Object.keys(entries)

      if (ids.length !== recipes.length) {
        actionError(action, 'ids not unique')
        return
      }

      state.ids = ids
      state.entities = entries
    },

    /** add a new the recipe */
    addRecipe(state, action: PayloadAction<{ recipe: Recipe }>) {
      const { recipe } = action.payload
      const { id } = recipe

      if (state.entities[id]) {
        actionError(action, 'id already used')
        return
      }

      state.ids.push(id)
      state.entities[id] = recipe
    },

    /** add a new the recipe */
    updateRecipe(state, action: PayloadAction<{ recipe: Recipe }>) {
      const { recipe } = action.payload
      const { id } = recipe

      if (!state.entities[id]) {
        actionError(action, 'id is unknown')
        return
      }

      state.entities[id] = recipe
    },

    /** add a new the recipe */
    removeRecipe(state, action: PayloadAction<{ id: string }>) {
      const { id } = action.payload

      if (!state.entities[id]) {
        actionError(action, 'id is unknown')
        return
      }

      state.ids.splice(state.ids.indexOf(id), 1)
      delete state.entities[id]
    },

    /** removes all recipes. */
    clearAllRecipes(state) {
      if (state.ids.length > 0) {
        state.ids = []
        state.entities = {}
      }
    },
  },
})

// Extract the action creators object and the reducer
export const { actions, reducer: recipesReducer } = recipesSlice
