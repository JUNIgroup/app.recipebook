import { assert as assertIs, boolean, integer, object, string } from 'superstruct'
import { ulid } from 'ulid'
import { BucketStructure, Doc } from '../database-types'
import {
  BucketNamePattern,
  BucketSchemas,
  CollectionNamePattern,
  DocSchema,
  IdPattern,
  IdSchema,
  RevisionNumberSchema,
} from './schema'

describe('IdPattern', () => {
  it.each`
    id                                        | type
    ${'0000'}                                 | ${'short ID'}
    ${'00000000-0000-0000-0000-000000000000'} | ${'long ID'}
    ${ulid()}                                 | ${'ULID'}
    ${ulid().toLowerCase()}                   | ${'ULID (lower case)'}
    ${'28f3f6c1-73f5-455a-b7d1-8957941c2cfa'} | ${'UUID'}
    ${'FBC13174-1FEA-4BB5-A7E2-C6B606067E7C'} | ${'UUID (upper case)'}
  `(`should pass for a valid $type $id`, ({ id }) => {
    // act
    const result = IdPattern.test(id)

    // assert
    expect(result).toBe(true)
  })

  it.each`
    id                                                                    | cause
    ${''}                                                                 | ${'empty'}
    ${'123'}                                                              | ${'too short'}
    ${'123456789-123456789-123456789-123456789-123456789-123456789-1234'} | ${'too long'}
    ${'ä-ä-ä-ä'}                                                          | ${'invalid letters'}
    ${'aaa/bbbb'}                                                         | ${'invalid characters'}
  `(`should fail for ID $id because it is $cause`, ({ id }) => {
    // act
    const result = IdPattern.test(id)

    // assert
    expect(result).toBe(false)
  })
})

describe.each`
  name                       | pattern
  ${'BucketNamePattern'}     | ${BucketNamePattern}
  ${'CollectionNamePattern'} | ${CollectionNamePattern}
`('$name', ({ pattern }) => {
  it.each`
    name                            | type
    ${'aaaa'}                       | ${'shortest name'}
    ${'a'.repeat(63)}               | ${'longest name'}
    ${'a-b.c_d~e'}                  | ${'special intermediate characters'}
    ${'abcdefghijklmnopqrstuvwxyz'} | ${'lower case letters'}
    ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'} | ${'upper case letters'}
    ${'with0123456789'}             | ${'with digits'}
  `(`should pass for a valid $type $name`, ({ name }) => {
    // act
    const result = pattern.test(name)

    // assert
    expect(result).toBe(true)
  })

  it.each`
    name              | cause
    ${''}             | ${'empty'}
    ${'aaa'}          | ${'too short'}
    ${'a'.repeat(64)} | ${'too long'}
    ${'aä'}           | ${'invalid letters'}
    ${'aaa/bbbb'}     | ${'invalid character'}
  `(`should fail for bucket name $name because it is $cause`, ({ name }) => {
    // act
    const result = BucketNamePattern.test(name)

    // assert
    expect(result).toBe(false)
  })
})

describe('IdSchema', () => {
  it('should accept minimal ID', () => {
    // arrange
    const id = '1234'

    // act
    assertIs(id, IdSchema)
  })

  it('should accept typical ID', () => {
    // arrange
    const id = ulid()

    // act
    assertIs(id, IdSchema)
  })

  it.each`
    id           | message
    ${undefined} | ${`Expected a string, but received: undefined`}
    ${123}       | ${`Expected a string, but received: 123`}
    ${'123'}     | ${`Expected a string matching`}
  `('should reject ID $id', ({ id, message }) => {
    // act
    const act = () => assertIs(id, IdSchema)

    // assert
    expect(act).toThrow(message)
  })
})

describe('RevisionNumberSchema', () => {
  it('should accept minimal revision', () => {
    // arrange
    const rev = 0

    // act
    assertIs(rev, RevisionNumberSchema)
  })

  it('should accept positive revision', () => {
    // arrange
    const rev = 423432

    // act
    assertIs(rev, RevisionNumberSchema)
  })

  it.each`
    rev           | message
    ${-1}         | ${`Expected a integer greater than or equal to 0`}
    ${0.123}      | ${`Expected an integer, but received: 0.123`}
    ${'787b0eca'} | ${`Expected an integer`}
  `('should reject rev $rev', ({ rev, message }) => {
    // act
    const act = () => assertIs(rev, RevisionNumberSchema)

    // assert
    expect(act).toThrow(message)
  })
})

describe('DocSchema', () => {
  it('should accept minimal doc', () => {
    // arrange
    const doc = { id: ulid(), rev: 0 }

    // act
    assertIs(doc, DocSchema)
  })

  it('should accept doc with additional fields', () => {
    // arrange
    const doc = { id: ulid(), rev: 0, foo: 'bar' }

    // act
    assertIs(doc, DocSchema)
  })

  it.each`
    doc                        | message
    ${{ id: 123, rev: 0 }}     | ${`At path: id -- Expected a string, but received: 123`}
    ${{ id: '1234', rev: -1 }} | ${`At path: rev -- Expected a integer greater than or equal to 0`}
  `('should reject doc $doc', ({ doc, message }) => {
    // act
    const act = () => assertIs(doc, DocSchema)

    // assert
    expect(act).toThrow(message)
  })
})

describe('BucketSchemas', () => {
  it('should accept minimal bucket schema', () => {
    // act
    const MinimalBucketSchema: BucketSchemas<BucketStructure> = {
      bucket: DocSchema,
      collections: {},
    }

    // assert
    expectTypeOf<BucketSchemas<BucketStructure>>().toMatchTypeOf(MinimalBucketSchema)
  })

  it('should accept complex bucket with collections schema', () => {
    // arrange
    type Foo = Doc & {
      foo: string
    }
    const FooSchema = object({
      id: IdSchema,
      rev: RevisionNumberSchema,
      foo: string(),
    })
    type Bar = Doc & {
      bar: number
    }
    const BarSchema = object({
      id: IdSchema,
      rev: RevisionNumberSchema,
      bar: integer(),
    })
    type Baz = Doc & {
      baz: boolean
    }
    const BazSchema = object({
      id: IdSchema,
      rev: RevisionNumberSchema,
      baz: boolean(),
    })
    type FooBucketType = {
      bucket: Foo
      collections: {
        bar: Bar
        baz: Baz
      }
    }

    // act
    const FooBucketSchema: BucketSchemas<FooBucketType> = {
      bucket: FooSchema,
      collections: {
        bar: BarSchema,
        baz: BazSchema,
      },
    }

    // assert
    expectTypeOf<BucketSchemas<FooBucketType>>().toMatchTypeOf(FooBucketSchema)
  })
})
