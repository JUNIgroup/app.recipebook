import { Describe, integer, min, pattern, string, type } from 'superstruct'
import { BucketStructure, DatabaseStructure, Doc } from '../database-types'

/**
 * Restriction for document IDs.
 *
 * - It contains only letters (a-z, A-Z), numbers (0-9), hyphens (-).
 * - It is between 4 and 63 characters long.
 */
export const IdPattern = /^[a-zA-Z0-9-]{4,63}$/

const NamePattern = /^[a-zA-Z][a-zA-Z0-9._~-]{2,61}[a-zA-Z0-9]$/

/**
 * Restrictions for bucket names.
 *
 * - It contains only letters (a-z, A-Z), numbers (0-9), periods (.), underscores (_), tildes (~), and hyphens (-).
 * - It starts with a letter.
 * - It ends with a letter or number.
 * - It is between 4 and 63 characters long.
 */
export const BucketNamePattern = NamePattern

/**
 * Restrictions for collection names.
 *
 * - It contains only letters (a-z, A-Z), numbers (0-9), periods (.), underscores (_), tildes (~), and hyphens (-).
 * - It starts with a letter.
 * - It ends with a letter or number.
 * - It is between 4 and 63 characters long.
 */
export const CollectionNamePattern = NamePattern

/**
 * Schema for an ID.
 */
export const IdSchema = pattern(string(), IdPattern)

/**
 * Schema for a revision number.
 */
export const RevisionNumberSchema = min(integer(), 0)

/**
 * Minimal schema for a document.
 */
export const DocSchema: Describe<Doc> = type({
  id: IdSchema,
  rev: RevisionNumberSchema,
})

/**
 * Schemas for a bucket.
 *
 * - Include schema for the bucket document.
 * - Include schemas for all collections documents.
 */
export type BucketSchemas<T extends BucketStructure> = {
  bucket: Describe<T['bucket']>
  collections: {
    [collectionName in keyof T['collections']]: Describe<T['collections'][collectionName]>
  }
}

/**
 * Schemas for a database.
 *
 * - Include schemas for all buckets.
 */
export type DatabaseSchemas<T extends DatabaseStructure> = {
  [bucketName in keyof T]: BucketSchemas<T[bucketName]>
}
