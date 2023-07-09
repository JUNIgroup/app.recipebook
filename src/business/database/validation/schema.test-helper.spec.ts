import { Describe, boolean, object } from 'superstruct'
import { BucketStructure, DatabaseStructure } from '../database-types'
import { BucketSchemas, DatabaseSchemas, DocSchema, IdSchema, RevisionNumberSchema } from './schema'
import { validateBucketSchemas, validateDatabaseSchemas } from './schema.test-helper'

describe('validateDatabaseSchemas', () => {
  it('should accept minimal database schemas', () => {
    // arrange
    const databaseSchemas = {
      testReport: {
        bucket: DocSchema,
        collections: {},
      },
    }

    // act
    validateDatabaseSchemas(databaseSchemas)
  })

  it('should accept typical database schemas', () => {
    // arrange
    type TestDocType = {
      id: string
      rev: number
      more: boolean
    }
    type TestDatabaseStructure = {
      testReport: {
        bucket: TestDocType
        collections: {
          testCase: TestDocType
          summary: TestDocType
        }
      }
      testRun: {
        bucket: TestDocType
        collections: Record<string, never>
      }
    }
    const TestDocSchema: Describe<TestDocType> = object({
      id: IdSchema,
      rev: RevisionNumberSchema,
      more: boolean(),
    })
    const databaseSchemas: DatabaseSchemas<TestDatabaseStructure> = {
      testReport: {
        bucket: TestDocSchema,
        collections: {
          testCase: TestDocSchema,
          summary: TestDocSchema,
        },
      },
      testRun: {
        bucket: TestDocSchema,
        collections: {},
      },
    }

    // act
    validateDatabaseSchemas(databaseSchemas)

    // assert
    expect(databaseSchemas).pass('validation passed')
  })

  it.each`
    databaseSchemas                                        | cause
    ${undefined}                                           | ${'database schema is not defined'}
    ${null}                                                | ${'database schema is not defined'}
    ${'foo'}                                               | ${'database schema is not an object'}
    ${{}}                                                  | ${'database schema is empty'}
    ${{ __foo__: { bucket: DocSchema, collections: {} } }} | ${`at path .__foo__ -- bucket name is invalid`}
    ${{ testReport: undefined }}                           | ${`at path .testReport -- bucket schema is not defined`}
    ${{ testReport: null }}                                | ${`at path .testReport -- bucket schema is not defined`}
    ${{ testReport: { bucket: undefined } }}               | ${`at path .testReport.bucket -- doc schema is not defined`}
  `('should reject database schemas $databaseSchemas', ({ databaseSchemas, cause }) => {
    // act
    const act = () => validateDatabaseSchemas(databaseSchemas)

    // assert
    expect(act).toThrow(cause)
  })

  it('should use path segments in error messages', () => {
    // arrange
    const databaseSchemas = undefined as unknown as DatabaseSchemas<DatabaseStructure>
    const path = ['foo', 'bar']

    // act
    const act = () => validateDatabaseSchemas(databaseSchemas, ...path)

    // assert
    expect(act).toThrow(`at path .foo.bar -- database schema is not defined`)
  })

  it('should prepend path segments to error messages', () => {
    // arrange
    const databaseSchemas = {
      testReport: {
        bucket: undefined as unknown as typeof DocSchema,
        collections: {},
      },
    }
    const path = ['foo', 'bar']

    // act
    const act = () => validateDatabaseSchemas(databaseSchemas, ...path)

    // assert
    expect(act).toThrow(`at path .foo.bar.testReport.bucket -- doc schema is not defined`)
  })
})

describe('validateBucketSchemas', () => {
  it('should accept minimal bucket schemas', () => {
    // arrange
    const bucketSchemas = {
      bucket: DocSchema,
      collections: {},
    }

    // act
    validateBucketSchemas(bucketSchemas)
  })

  it('should accept bucket schemas with collection', () => {
    // arrange
    const bucketSchemas = {
      bucket: DocSchema,
      collections: {
        collection: DocSchema,
      },
    }

    // act
    validateBucketSchemas(bucketSchemas)
  })

  it('should accept typical bucket schemas', () => {
    // arrange
    type TestDocType = {
      id: string
      rev: number
      more: boolean
    }
    type TestBucketStructure = {
      bucket: TestDocType
      collections: {
        testCase: TestDocType
        summary: TestDocType
      }
    }
    const TestDocSchema: Describe<TestDocType> = object({
      id: IdSchema,
      rev: RevisionNumberSchema,
      more: boolean(),
    })
    const bucketSchemas: BucketSchemas<TestBucketStructure> = {
      bucket: TestDocSchema,
      collections: {
        testCase: TestDocSchema,
        summary: TestDocSchema,
      },
    }

    // act
    validateBucketSchemas(bucketSchemas)

    // assert
    expect(bucketSchemas).pass('validation passed')
  })

  it.each`
    bucketSchemas                                                 | cause
    ${undefined}                                                  | ${'bucket schema is not defined'}
    ${null}                                                       | ${'bucket schema is not defined'}
    ${'foo'}                                                      | ${'bucket schema is not an object'}
    ${{ bucket: undefined, collections: {} }}                     | ${`at path .bucket -- doc schema is not defined`}
    ${{ bucket: DocSchema }}                                      | ${`at path .collections -- collections record is not defined`}
    ${{ bucket: DocSchema, collections: { __foo__: DocSchema } }} | ${`at path .collections.__foo__ -- collection name is invalid`}
    ${{ bucket: DocSchema, collections: { fooBar: undefined } }}  | ${`at path .collections.fooBar -- doc schema is not defined`}
  `('should reject bucket schemas $bucketSchemas', ({ bucketSchemas, cause }) => {
    // act
    const act = () => validateBucketSchemas(bucketSchemas)

    // assert
    expect(act).toThrow(cause)
  })

  it('should use path segments in error messages', () => {
    // arrange
    const bucketSchemas = undefined as unknown as BucketSchemas<BucketStructure>
    const path = ['foo', 'bar']

    // act
    const act = () => validateBucketSchemas(bucketSchemas, ...path)

    // assert
    expect(act).toThrow(`at path .foo.bar -- bucket schema is not defined`)
  })

  it('should prepend path segments to error messages', () => {
    // arrange
    const bucketSchemas = {
      bucket: DocSchema,
      collections: {
        __foo__: DocSchema,
      },
    }
    const path = ['foo', 'bar']

    // act
    const act = () => validateBucketSchemas(bucketSchemas, ...path)

    // assert
    expect(act).toThrow(`at path .foo.bar.collections.__foo__ -- collection name is invalid`)
  })
})
