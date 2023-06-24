import { Observable } from 'rxjs'
import { BucketName, Doc, EpochTimestamp, ID } from './database-types'

/**
 * A path to a database collection.
 *
 * - It can be a path to a bucket, or
 * - it can be a path to a collection in a bucket.
 */
export type CollectionPath = Readonly<
  | {
      bucket: BucketName
    }
  | {
      bucket: BucketName
      bucketId: ID
      collection: BucketName
    }
>

export interface Result<T> {
  lastUpdate: EpochTimestamp
  doc: T
}

export interface Database {
  getDocs(path: CollectionPath, after?: EpochTimestamp): Observable<Array<Result<Doc>>>
  putDoc(path: CollectionPath, doc: Doc): Promise<Result<Doc>>
}
