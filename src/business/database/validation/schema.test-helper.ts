import { Describe } from 'superstruct'
import { BucketStructure, DatabaseStructure, Doc } from '../database-types'
import { BucketNamePattern, BucketSchemas, CollectionNamePattern, DatabaseSchemas } from './schema'

type Segment = string | undefined

/**
 * Validate a complete database schema with multiple bucket schemas.
 *
 * - Validate all bucket names.
 * - Validate all bucket schemas.
 *
 * @param databaseSchemas the database schema to validate.
 * @param path optional path segments to prepend to th path of the error message.
 */
export function validateDatabaseSchemas<T extends DatabaseStructure>(
  databaseSchemas: DatabaseSchemas<T>,
  ...path: Segment[]
) {
  if (databaseSchemas == null) fail(`database schema is not defined`, ...path)
  if (typeof databaseSchemas !== 'object') fail(`database schema is not an object`, ...path)

  const entries = Object.entries(databaseSchemas)
  if (entries.length === 0) fail(`database schema is empty`)
  entries.forEach(([bucketName, bucketSchemas]) => {
    if (!BucketNamePattern.test(bucketName)) fail(`bucket name is invalid`, ...path, bucketName)
    validateBucketSchemas(bucketSchemas, ...path, bucketName)
  })
}

/**
 * Validate a bucket schema.
 *
 * - Validate the bucket name, if given.
 * - Validate the bucket doc schema.
 * - Validate all collection names.
 * - Validate all collection doc schemas.
 *
 * @param bucketSchemas the bucket schema to validate.
 * @param bucketName the bucket name to validate.
 */
export function validateBucketSchemas<T extends BucketStructure>(bucketSchemas: BucketSchemas<T>, ...path: Segment[]) {
  if (bucketSchemas == null) fail(`bucket schema is not defined`, ...path)
  if (typeof bucketSchemas !== 'object') fail(`bucket schema is not an object`, ...path)

  validateDocSchema(bucketSchemas.bucket, ...path, 'bucket')

  if (bucketSchemas.collections == null) fail(`collections record is not defined`, ...path, 'collections')
  const entries = Object.entries(bucketSchemas.collections)
  entries.forEach(([collectionName, collectionSchema]) => {
    if (!CollectionNamePattern.test(collectionName))
      fail(`collection name is invalid`, ...path, 'collections', collectionName)
    validateDocSchema(collectionSchema, ...path, 'collections', collectionName)
  })
}

function fail(error: string, ...path: Segment[]): never {
  throw new Error(`${atPath(...path)}${error}`)
}

function validateDocSchema<T extends Doc>(docSchema: Describe<T>, ...path: Segment[]) {
  if (docSchema == null) fail(`doc schema is not defined`, ...path)
}

function atPath(...segments: Segment[]) {
  const filtered = segments.filter((segment) => segment !== undefined)
  if (filtered.length === 0) return ''
  return `at path .${filtered.join('.')} -- `
}
