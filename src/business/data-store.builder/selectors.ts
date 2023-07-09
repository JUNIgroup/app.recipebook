import { createSelector } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import { BucketStructure, ID } from '../database/database-types'
import { Order } from './orders'
import { BucketsState } from './types'

const memoizeShallowArray = {
  equalityCheck: (a: unknown, b: unknown) => a === b,
  resultEqualityCheck: shallowEqual,
}

export type RootSelector<T extends BucketStructure, S = unknown> = (state: S) => BucketsState<T>

/**
 * Create a selector for all bucket documents.
 *
 * @param rootSelector the selector to select the buckets state from the app state
 * @returns the selector
 */
export function createSelectAllBucketDocuments<T extends BucketStructure, S = unknown>(
  rootSelector: RootSelector<T, S>,
) {
  return createSelector(
    [rootSelector], //
    (state) => state.ids.map((id) => state.buckets[id].entity),
    { memoizeOptions: memoizeShallowArray },
  )
}

/**
 * Create a selector for all bucket documents sorted by the given order.
 *
 * @param rootSelector the selector to select the buckets state from the app state
 * @param order the order function
 * @returns the selector
 */
export function createSelectAllBucketDocumentsSorted<T extends BucketStructure, S = unknown>(
  rootSelector: RootSelector<T, S>,
  order: Order<T['bucket']>,
) {
  return createSelector(
    [createSelectAllBucketDocuments(rootSelector)], //
    (entities) => reorder(order, entities),
  )
}

/**
 * Create a selector for a bucket document by id.
 *
 * If the document does not exist, the selector will return null.
 *
 * @param rootSelector the selector to select the buckets state from the app state
 * @returns the selector
 */
export function createSelectBucketDocumentById<T extends BucketStructure, S = unknown>(
  rootSelector: RootSelector<T, S>,
) {
  const resultFunc = (state: BucketsState<T>, id: ID) => state.buckets[id]?.entity ?? null
  const selector = (state: S, id: ID) => resultFunc(rootSelector(state), id)
  selector.resultFunc = resultFunc
  return selector
}

/**
 * Create a selector for all documents of the given collection.
 *
 * @param rootSelector the selector to select the buckets state from the app state
 * @param collectionName the name of the collection
 * @returns the selector
 */
export function createSelectAllCollectionDocuments<
  T extends BucketStructure,
  C extends keyof T['collections'],
  S = unknown,
>(rootSelector: RootSelector<T, S>, collectionName: C) {
  return createSelector(
    [(state: S, bucketId: ID) => rootSelector(state).buckets[bucketId]?.collections?.[collectionName]],
    (collection) => (collection ? collection.ids.map((id) => collection.entities[id]) : []),
    { memoizeOptions: memoizeShallowArray },
  )
}

/**
 * Create a selector for all documents of the given collection sorted by the given order.
 *
 * @param rootSelector the selector to select the buckets state from the app state
 * @param collectionName the name of the collection
 * @param order the order function
 * @returns the selector
 */
export function createSelectAllCollectionDocumentsSorted<
  T extends BucketStructure,
  C extends keyof T['collections'],
  S = unknown,
>(rootSelector: RootSelector<T, S>, collectionName: C, order: Order<T['collections'][C]>) {
  return createSelector(
    [createSelectAllCollectionDocuments(rootSelector, collectionName)], //
    (entities) => reorder(order, entities),
  )
}

/**
 * Create a selector for a document of the given collection by id.
 *
 * If the document does not exist, the selector will return null.
 *
 * @param rootSelector the selector to select the buckets state from the app state
 * @param collectionName the name of the collection
 * @returns the selector
 */
export function createSelectCollectionDocumentById<
  T extends BucketStructure,
  C extends keyof T['collections'],
  S = unknown,
>(rootSelector: RootSelector<T, S>, collectionName: C) {
  const resultFunc = (state: BucketsState<T>, bucketId: ID, id: ID) =>
    state.buckets[bucketId]?.collections?.[collectionName]?.entities[id] ?? null
  const selector = (state: S, bucketId: ID, id: ID) => resultFunc(rootSelector(state), bucketId, id)
  selector.resultFunc = resultFunc
  return selector
}

function reorder<T>(order: Order<T>, array: T[]): T[] {
  return [...array].sort(order)
}
