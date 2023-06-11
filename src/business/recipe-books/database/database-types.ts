/**
 * The ID type is a string that is used to identify a document.
 *
 * - It has to be unique over all collections and documents.
 * - It is between 4 and 63 characters long.
 * - It contains only letters (a-z, A-Z), numbers (0-9), hyphens (-).
 * - It is compatible with UUID and ULID.
 */
export type ID = string

/**
 * The name of a bucket.
 *
 * - It is between 4 and 63 characters long.
 * - It contains only letters (a-z, A-Z), numbers (0-9), periods (.), underscores (_), tildes (~), and hyphens (-).
 * - It starts with a letter.
 * - It ends with a letter or number.
 */
export type BucketName = string

/**
 * The name of a collection.
 *
 * - It is between 4 and 63 characters long.
 * - It contains only letters (a-z, A-Z), numbers (0-9), periods (.), underscores (_), tildes (~), and hyphens (-).
 * - It starts with a letter.
 * - It ends with a letter or number.
 */
export type CollectionName = string

/**
 * The number of milliseconds elapsed since the epoch (1970-01-01T00:00:00.000Z).
 *
 * E.g. this is the return value of Date.now().
 */
export type EpochTimestamp = number

/**
 * Minimal interface of a document.
 */
export interface Doc {
  id: ID
  rev: number
}

/**
 * Minimal structure for a bucket with sub-collections.
 */
export type BucketStructure = {
  bucket: Doc
  collections: {
    [collectionName: CollectionName]: Doc
  }
}

/**
 * Minimal structure for a database.
 */
export type DatabaseStructure = {
  [bucketName: BucketName]: BucketStructure
}
