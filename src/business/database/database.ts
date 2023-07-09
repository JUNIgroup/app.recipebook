import { Observable } from 'rxjs'
import { encodeTime } from 'ulid'
import { BucketName, Doc, EpochTimestamp, ID } from './database-types'

/**
 * A unique identifier for an operationCode.
 * Used to identify all traces of the operation in the logs.
 *
 * E.g. use `encodeTime(Date.now(), 10)`.
 */
export type OperationCode = string

/**
 * Create a new operation code. This code should be used for all traces triggered by the same operation.
 *
 * @param time the time to use for the operation code. Defaults to `Date.now()`.
 * @returns a new operation code.
 */
export const createOperationCode = (time: number = Date.now()): OperationCode => encodeTime(time, 10)

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
  getDocs(operationCode: OperationCode, path: CollectionPath, after?: EpochTimestamp): Observable<Array<Result<Doc>>>
  putDoc(operationCode: OperationCode, path: CollectionPath, doc: Doc): Promise<Result<Doc>>
}
