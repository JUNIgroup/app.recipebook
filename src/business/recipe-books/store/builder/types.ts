import { Action } from '@reduxjs/toolkit'
import { BucketStructure, Doc, ID } from '../../../database/database-types'

export type BucketsState<T extends BucketStructure> = {
  ids: ID[]
  lastUpdate?: number
  buckets: {
    [id: ID]: BucketState<T>
  }
}

export type BucketState<T extends BucketStructure> = {
  entity: T['bucket']
  collections: {
    [name in keyof T['collections']]?: BucketCollectionState<T['collections'][name]>
  }
}

export type BucketCollectionState<T extends Doc> = {
  ids: ID[]
  lastUpdate?: number
  entities: {
    [id: ID]: T
  }
}

export type OnActionError = (action: Action, message: string) => void
