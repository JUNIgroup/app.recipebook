import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../../app.store'
import { byText } from '../../helper/redux/redux-selector-helper'
import { Recipe, RecipeBook } from '../model'

type PartialRootState = Pick<RootState, 'recipeBooks'>

type Collection = 'recipes'

const emptyCollection = Object.freeze({ ids: [] as string[], entities: {} as Record<string, never> })

const selectRoot = (state: PartialRootState) => state.recipeBooks
const selectCollection = (collection: Collection) => (state: PartialRootState, bucketId: string) =>
  selectRoot(state).buckets[bucketId]?.[collection] ?? emptyCollection
const idParameter = (_state: PartialRootState, id: string) => id

export const selectAllBucketDocuments = createSelector(
  selectRoot, //
  (state) => state.ids.map((id) => state.buckets[id].entity),
)

export const selectAllBucketDocumentsSortedByString = (extractor: (doc: RecipeBook) => string) =>
  createSelector(
    selectRoot, //
    (state) => state.ids.map((id) => state.buckets[id].entity).sort(byText((entity) => extractor(entity))),
  )

export const selectBucketDocumentById = createSelector(
  [selectRoot, idParameter], //
  (state, id) => state.buckets[id]?.entity ?? null,
)

export const selectCollectionDocuments = (collection: Collection) =>
  createSelector(
    selectCollection(collection), //
    ({ ids, entities }) => ids.map((id) => entities[id]),
  )

export const selectCollectionDocumentsSortedByString = (collection: Collection, extractor: (doc: Recipe) => string) =>
  createSelector(
    selectCollection(collection), //
    ({ ids, entities }) => ids.map((id) => entities[id]).sort(byText((entity) => extractor(entity))),
  )

export const selectCollectionDocumentById = (collection: Collection) =>
  createSelector(
    [selectCollection(collection), idParameter], //
    ({ entities }, id) => entities[id] ?? null,
  )
