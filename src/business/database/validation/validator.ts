import { Struct, validate as validateSchema } from 'superstruct'
import { CollectionPath } from '../database'
import { DatabaseStructure, Doc } from '../database-types'
import { DatabaseSchemas, IdPattern } from './schema'

/**
 * Validator function for a path and a doc.
 */
export type Validator = (path: CollectionPath, doc: Doc) => null | string

/**
 * Validate, that ID of path and doc match the ID pattern.
 */
export function idValidator(): Validator {
  return function validateId(path: CollectionPath, doc: Doc) {
    if ('bucketId' in path && !IdPattern.test(path.bucketId)) {
      return `ID '${path.bucketId}' of bucket ${path.bucket} does not match pattern ${IdPattern}`
    }
    if (!IdPattern.test(doc.id)) {
      return `ID '${doc.id}' if document does not match pattern ${IdPattern}`
    }
    return null
  }
}

/**
 * Validate, that rev of doc is 0 or positive.
 */
export function revisionValidator(): Validator {
  return function validateRevision(_path: CollectionPath, doc: Doc) {
    if (doc.rev < 0) {
      return `Rev ${doc.rev} of document ${doc.id} is negative`
    }
    return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStruct = Struct<any>

/**
 * Validate, that the path has defined a schema and the doc matches that schema.
 *
 * @param databaseSchemas the database schemas to validate against.
 */
export function databaseSchemaValidator<T extends DatabaseStructure>(databaseSchemas: DatabaseSchemas<T>): Validator {
  return function validateDatabaseSchema(path: CollectionPath, doc: Doc) {
    const bucketSchemas = databaseSchemas[path.bucket]
    if (bucketSchemas == null) {
      return `Bucket ${path.bucket} is not defined in database`
    }
    let docSchema: AnyStruct
    if ('collection' in path) {
      docSchema = bucketSchemas.collections[path.collection]
      if (docSchema == null) {
        return `Collection ${path.collection} is not defined in bucket ${path.bucket}`
      }
    } else {
      docSchema = bucketSchemas.bucket
    }
    const [error] = validateSchema(doc, docSchema)
    if (error != null) {
      return `Document ${doc.id} does not match schema: ${error.message}`
    }
    return null
  }
}
