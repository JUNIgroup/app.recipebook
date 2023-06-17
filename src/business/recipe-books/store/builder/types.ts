import { BucketStructure, Doc, ID } from '../../database/database-types'

export type BucketsState<T extends BucketStructure> = {
  ids: ID[]
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
  entities: {
    [id: ID]: T
  }
}
