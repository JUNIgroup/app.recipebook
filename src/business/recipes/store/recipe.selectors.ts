import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../../app.store'
import { byText } from '../../helper/redux/redux-selector-helper'

type PartialRootState = Pick<RootState, 'recipes'>

const selectRecipesState = (state: PartialRootState) => state.recipes

export const selectRecipeCount = createSelector(
  selectRecipesState, //
  (state) => state.ids.length,
)

export const selectAllRecipes = createSelector(
  selectRecipesState, //
  (state) => state.ids.map((id) => state.entities[id]),
)

export const selectAllRecipesSortedByName = createSelector(
  selectRecipesState, //
  (state) => state.ids.map((id) => state.entities[id]).sort(byText((recipe) => recipe.title)),
)

export const selectRecipeById = createSelector(
  [selectRecipesState, (_state: PartialRootState, id: string) => id], //
  (state, id) => state.entities[id] ?? null,
)
