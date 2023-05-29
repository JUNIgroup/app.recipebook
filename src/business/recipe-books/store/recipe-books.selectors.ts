import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../../app.store'
import { byText } from '../../helper/redux/redux-selector-helper'
import { RecipeBook } from '../model'

type PartialRootState = Pick<RootState, 'recipeBooks'>

const selectRoot = (state: PartialRootState) => state.recipeBooks
const selectBucket = (state: PartialRootState) => selectRoot(state).recipeBooks

export const selectAllBucketDocuments = createSelector(
  selectBucket, //
  (state) => state.ids.map((id) => state.entities[id]),
)

export const selectAllBucketDocumentsSortedByString = (extractor: (doc: RecipeBook) => string) =>
  createSelector(
    selectBucket, //
    (state) => state.ids.map((id) => state.entities[id]).sort(byText((entity) => extractor(entity))),
  )

export const selectBucketById = createSelector(
  [selectBucket, (_state: PartialRootState, id: string | null | undefined) => id], //
  (state, id) => (id == null ? null : state.entities[id] ?? null),
)

// export const selectRecipeById = createSelector(
//   [selectBucketState, (_state: PartialRootState, id: string) => id], //
//   (state, id) => state.entities[id] ?? null,
// )
