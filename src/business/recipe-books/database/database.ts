import { Observable } from 'rxjs'

/**
 * The ID type is a string that is used to identify a document.
 *
 * - It has to be unique over all collections and documents.
 * - It should not be empty.
 * - It should only contain alphanumeric characters, and hyphens, e.g. UUIDs.
 */
export type ID = string

/**
 * The name of a bucket.
 */
export type BucketName = string

/**
 * The name of a collection.
 */
export type CollectionName = string

/**
 * The number of milliseconds elapsed since the epoch (1970-01-01T00:00:00.000Z).
 *
 * E.g. this is the return value of Date.now().
 */
export type EpochTimestamp = number

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

export interface Doc {
  id: ID
  rev: number
}

export interface Result<T> {
  lastUpdate: EpochTimestamp
  doc: T
}

export interface Database {
  getDocs(path: CollectionPath, after?: EpochTimestamp): Observable<Result<Doc>>
  putDoc(path: CollectionPath, doc: Doc): Promise<Result<Doc>>
  delDoc(path: CollectionPath, doc: Doc): Promise<void>
}
