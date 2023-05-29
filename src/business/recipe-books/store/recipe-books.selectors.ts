import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../../app.store'
import { byText } from '../../helper/redux/redux-selector-helper'
import { Recipe, RecipeBook } from '../model'

type Collection = 'recipes'

type PartialRootState = Pick<RootState, 'recipeBooks'>

const selectRoot = (state: PartialRootState) => state.recipeBooks
const selectBucket = (state: PartialRootState) => selectRoot(state).recipeBooks
const selectCollectionEntities = (collection: Collection) => (state: PartialRootState) =>
  selectRoot(state)[collection].entities
const selectCollectionIds = (collection: Collection) => (state: PartialRootState, id: string | null) =>
  id == null ? [] : selectBucket(state).entities[id]?.[collection] ?? []
const idParameter = (_state: PartialRootState, id: string | null) => id

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
  [selectBucket, idParameter], //
  (state, id) => (id == null ? null : state.entities[id] ?? null),
)

export const selectCollectionDocuments = (collection: Collection) =>
  createSelector(
    [selectCollectionEntities(collection), selectCollectionIds(collection)], //
    (entities, ids) => ids.map((id) => entities[id]),
  )

export const selectCollectionDocumentsSortedByString = (collection: Collection, extractor: (doc: Recipe) => string) =>
  createSelector(
    [selectCollectionEntities(collection), selectCollectionIds(collection)], //
    (entities, ids) => ids.map((id) => entities[id]).sort(byText((entity) => extractor(entity))),
  )

export const selectCollectionDocumentById = (collection: Collection) =>
  createSelector(
    [selectCollectionEntities(collection), idParameter], //
    (entities, id) => (id == null ? null : entities[id] ?? null),
  )
