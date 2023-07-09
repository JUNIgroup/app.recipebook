import { number, object, string } from 'superstruct'
import { ulid } from 'ulid'
import { Doc } from '../database-types'
import { DatabaseSchemas } from './schema'
import { databaseSchemaValidator, idValidator, revisionValidator } from './validator'

describe('idValidator', () => {
  it('should return a function', () => {
    // act
    const validator = idValidator()

    // assert
    expect(validator).toBeFunction()
  })

  it('should return null for valid bucket path and doc', () => {
    // arrange
    const validator = idValidator()
    const path = { bucket: 'foo', bucketId: ulid(), collection: 'bar' }
    const doc = { id: ulid(), rev: 0 }

    // act
    const result = validator(path, doc)

    // assert
    expect(result).toBeNull()
  })

  it('should return null for valid collection path and doc', () => {
    // arrange
    const validator = idValidator()
    const path = { bucket: 'foo', bucketId: ulid(), collection: 'bar' }
    const doc = { id: ulid(), rev: 0 }

    // act
    const result = validator(path, doc)

    // assert
    expect(result).toBeNull()
  })

  it('should return error for invalid bucket ID', () => {
    // arrange
    const validator = idValidator()
    const invalidBucketId = 'b1' // to short
    const path = { bucket: 'foo', bucketId: invalidBucketId, collection: 'bar' }
    const doc = { id: ulid(), rev: 0 }

    // act
    const result = validator(path, doc)

    // assert
    expect(result).toStartWith(`ID 'b1' of bucket foo does not match pattern`)
  })

  it('should return error for invalid doc ID', () => {
    // arrange
    const validator = idValidator()
    const invalidDocId = 'd1' // to short
    const path = { bucket: 'foo' }
    const doc = { id: invalidDocId, rev: 0 }

    // act
    const result = validator(path, doc)

    // assert
    expect(result).toStartWith(`ID 'd1' if document does not match pattern`)
  })
})

describe('revisionValidator', () => {
  it('should return a function', () => {
    // act
    const validator = revisionValidator()

    // assert
    expect(validator).toBeFunction()
  })

  it('should return null for valid doc', () => {
    // arrange
    const validator = revisionValidator()
    const path = { bucket: 'foo' }
    const doc = { id: ulid(), rev: 0 }

    // act
    const result = validator(path, doc)

    // assert
    expect(result).toBeNull()
  })

  it('should return error for negative rev', () => {
    // arrange
    const validator = revisionValidator()
    const path = { bucket: 'foo' }
    const doc = { id: ulid(), rev: -1 }

    // act
    const result = validator(path, doc)

    // assert
    expect(result).toStartWith(`Rev -1 of document ${doc.id} is negative`)
  })
})

describe('databaseSchemaValidator', () => {
  it('should return a function', () => {
    // act
    const validator = databaseSchemaValidator({})

    // assert
    expect(validator).toBeFunction()
  })

  type TestDatabaseStructure = {
    foo: {
      bucket: Doc & { foo: string }
      collections: {
        bar: Doc & { bar: string }
        baz: Doc & { baz: string }
      }
    }
    qux: {
      bucket: Doc & { qux: string }
      collections: Record<string, never>
    }
  }
  const databaseSchemas: DatabaseSchemas<TestDatabaseStructure> = {
    foo: {
      bucket: object({ id: string(), rev: number(), foo: string() }),
      collections: {
        bar: object({ id: string(), rev: number(), bar: string() }),
        baz: object({ id: string(), rev: number(), baz: string() }),
      },
    },
    qux: {
      bucket: object({ id: string(), rev: number(), qux: string() }),
      collections: {},
    },
  }

  it('should return null for valid bucket path and doc', () => {
    // arrange
    const validator = databaseSchemaValidator(databaseSchemas)
    const path = { bucket: 'qux' }
    const doc = { id: ulid(), rev: 0, qux: 'qux-1-2-3' }

    // act
    const result = validator(path, doc)

    // assert
    expect(result).toBeNull()
  })

  it('should return null for valid collection path and doc', () => {
    // arrange
    const validator = databaseSchemaValidator(databaseSchemas)
    const path = { bucket: 'foo', bucketId: ulid(), collection: 'baz' }
    const doc = { id: ulid(), rev: 0, baz: 'baz-1-2-3' }

    // act
    const result = validator(path, doc)

    // assert
    expect(result).toBeNull()
  })

  it('should return error for unknown bucket', () => {
    // arrange
    const validator = databaseSchemaValidator(databaseSchemas)
    const path = { bucket: 'unknown' }
    const doc = { id: ulid(), rev: 0 }

    // act
    const result = validator(path, doc)

    // assert
    expect(result).toStartWith(`Bucket unknown is not defined in database`)
  })

  it('should return error for unknown collection', () => {
    // arrange
    const validator = databaseSchemaValidator(databaseSchemas)
    const path = { bucket: 'foo', bucketId: ulid(), collection: 'unknown' }
    const doc = { id: ulid(), rev: 0 }

    // act
    const result = validator(path, doc)

    // assert
    expect(result).toStartWith(`Collection unknown is not defined in bucket foo`)
  })

  it('should return error for invalid bucket doc', () => {
    // arrange
    const validator = databaseSchemaValidator(databaseSchemas)
    const path = { bucket: 'foo' }
    const doc = { id: ulid(), rev: 0, unknown: 'unknown' }

    // act
    const result = validator(path, doc)

    // assert
    expect(result).toStartWith(`Document ${doc.id} does not match schema: At path: foo -- `)
  })

  it('should return error for invalid collection doc', () => {
    // arrange
    const validator = databaseSchemaValidator(databaseSchemas)
    const path = { bucket: 'foo', bucketId: ulid(), collection: 'baz' }
    const doc = { id: ulid(), rev: 0, unknown: 'unknown' }

    // act
    const result = validator(path, doc)

    // assert
    expect(result).toStartWith(`Document ${doc.id} does not match schema: At path: baz -- `)
  })
})
