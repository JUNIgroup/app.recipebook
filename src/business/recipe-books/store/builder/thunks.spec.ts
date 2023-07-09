import { AnyAction, ThunkDispatch, createAction } from '@reduxjs/toolkit'
import { EMPTY, bufferCount, of, throwError } from 'rxjs'
import { Log } from '../../../../utilities/logger'
import { createFakeLogger } from '../../../../utilities/logger/fake-logger.test-helper'
import { Database } from '../../../database/database'
import { Doc } from '../../../database/database-types'
import { BucketsActionCreator } from './slice.types'
import {
  ThunkActionCreator,
  ThunkActionCreatorWithPayload,
  createPushBucketDocument,
  createPushCollectionDocument,
  createRefreshBucketDocuments,
  createRefreshCollectionDocuments,
} from './thunks'
import { BucketsState } from './types'

type TestDoc = Doc & { info: string }

type TestStructure = {
  bucket: TestDoc
  collections: {
    testCases: TestDoc
  }
}
const sliceName = 'testSlice'
const upsertBuckets = createAction('upsertBuckets') as BucketsActionCreator<TestStructure>['upsertBuckets']
const upsertCollection = createAction('upsertCollection') as BucketsActionCreator<TestStructure>['upsertCollection']

let actions: BucketsActionCreator<TestStructure>
let thunkLogs: Record<string, Log>
let database: Database
let dispatch: ThunkDispatch<unknown, never, AnyAction>

beforeEach(() => {
  actions = {
    upsertBuckets,
    upsertCollection,
    clear: vi.fn(),
  }

  const fakeLogger = createFakeLogger()
  thunkLogs = {
    [sliceName]: fakeLogger(sliceName),
  }

  database = {
    getDocs: vi.fn(() => EMPTY),
    putDoc: vi.fn((_operationCode, _path, doc) => Promise.resolve({ lastUpdate: 0, doc })),
  }

  dispatch = vi.fn()
})

describe('createRefreshBucketDocuments', () => {
  let bucketsState: BucketsState<TestStructure>
  let refreshBucketDocuments: ThunkActionCreator

  beforeEach(() => {
    bucketsState = {
      ids: [],
      buckets: {},
    }

    const rootSelector = () => bucketsState
    refreshBucketDocuments = createRefreshBucketDocuments(rootSelector, { sliceName, actions })
  })

  it('should create a thunk action', () => {
    // act
    const thunkAction = refreshBucketDocuments()

    // assert
    expect(thunkAction).toBeFunction()
  })

  it.each`
    lastUpdate
    ${undefined}
    ${1234}
  `(
    'should call the database to get the bucket documents with stored last update $lastUpdate',
    async ({ lastUpdate }) => {
      // arrange
      bucketsState.lastUpdate = lastUpdate
      const thunkAction = refreshBucketDocuments()

      // act
      await thunkAction(dispatch, () => 'state', { database, thunkLogs })

      // assert
      expect(database.getDocs).toHaveBeenCalledWith(expect.any(String), { bucket: sliceName }, lastUpdate)
    },
  )

  it('should dispatch nothing, if the database returns no results', async () => {
    // arrange
    database.getDocs = () => EMPTY
    const thunkAction = refreshBucketDocuments()

    // act
    await thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('should dispatch upsertBucket for each chunk returned by database', async () => {
    // arrange
    const results = [
      { lastUpdate: 1, doc: { id: '1', rev: 1, info: 'chunk1' } },
      { lastUpdate: 2, doc: { id: '2', rev: 2, info: 'chunk1' } },
      { lastUpdate: 3, doc: { id: '3', rev: 3, info: 'chunk2' } }, //
    ]
    database.getDocs = () => of(...results).pipe(bufferCount(2))
    const thunkAction = refreshBucketDocuments()

    // act
    await thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      upsertBuckets({ documents: [results[0].doc, results[1].doc], deleted: [], lastUpdate: 2 }),
    )
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      upsertBuckets({ documents: [results[2].doc], deleted: [], lastUpdate: 3 }),
    )
  })

  it('should dispatch upsertBucket with deleted ids, if the database returns deleted documents', async () => {
    // arrange
    const results = [
      { lastUpdate: 1, doc: { id: '1', rev: 1, info: 'chunk1' } },
      { lastUpdate: 2, doc: { id: '2', rev: 2, info: 'chunk1', __deleted: true } },
      { lastUpdate: 3, doc: { id: '3', rev: 3, info: 'chunk2' } }, //
    ]
    database.getDocs = () => of(...results).pipe(bufferCount(2))
    const thunkAction = refreshBucketDocuments()

    // act
    await thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      upsertBuckets({ documents: [results[0].doc], deleted: [results[1].doc.id], lastUpdate: 2 }),
    )
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      upsertBuckets({ documents: [results[2].doc], deleted: [], lastUpdate: 3 }),
    )
  })

  it('should reject the promise, if the database throws an error', async () => {
    // arrange
    const error = new Error('test error')
    database.getDocs = () => throwError(() => error)
    const thunkAction = refreshBucketDocuments()

    // act
    const promise = thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    await expect(promise).rejects.toThrow(error)
  })
})

describe('createPushBucketDocument', () => {
  let pushBucketDocument: ThunkActionCreatorWithPayload<TestDoc>

  beforeEach(() => {
    const prepare = (doc: TestDoc) => ({ document: doc })
    pushBucketDocument = createPushBucketDocument('my-opp', { sliceName, actions }, prepare)
  })

  it('should create a thunk action', () => {
    // act
    const thunkAction = pushBucketDocument({ id: '1', rev: 1, info: 'test' })

    // assert
    expect(thunkAction).toBeFunction()
  })

  it('should call the database to put the document', async () => {
    // arrange
    const thunkAction = pushBucketDocument({ id: '1', rev: 1, info: 'test' })

    // act
    await thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    expect(database.putDoc).toHaveBeenCalledWith(
      expect.any(String),
      { bucket: sliceName },
      { id: '1', rev: 1, info: 'test' },
    )
  })

  it('should dispatch upsertBucket with the document returned by the database but skip lastUpdate', async () => {
    // arrange
    const doc = { id: '1', rev: 1, info: 'test' }
    database.putDoc = () => Promise.resolve({ lastUpdate: 1, doc })
    const thunkAction = pushBucketDocument(doc)

    // act
    await thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    expect(dispatch).toHaveBeenCalledWith(upsertBuckets({ documents: [doc] }))
  })

  it('should dispatch upsertBucket with the deleted document returned by the database', async () => {
    // arrange
    const doc = { id: '1', rev: 1, info: 'test', __deleted: true }
    database.putDoc = () => Promise.resolve({ lastUpdate: 1, doc })
    const thunkAction = pushBucketDocument(doc)

    // act
    await thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    expect(dispatch).toHaveBeenCalledWith(upsertBuckets({ deleted: [doc.id] }))
  })

  it('should reject the promise, if the database throws an error', async () => {
    // arrange
    const error = new Error('test error')
    database.putDoc = () => Promise.reject(error)
    const thunkAction = pushBucketDocument({ id: '1', rev: 1, info: 'test' })

    // act
    const promise = thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    await expect(promise).rejects.toThrow(error)
  })
})

describe('createRefreshCollectionDocuments', () => {
  let bucketsState: BucketsState<TestStructure>
  let refreshCollectionDocuments: ThunkActionCreatorWithPayload<{ bucketId: string }>

  beforeEach(() => {
    bucketsState = {
      ids: ['testBucketId'],
      buckets: {
        testBucketId: {
          entity: { id: 'testBucketId', rev: 1, info: 'testBucket' },
          collections: {},
        },
      },
    }

    const rootSelector = () => bucketsState
    const prepare = ({ bucketId }: { bucketId: string }) => ({ bucketId, collectionName: 'testCases' as const })
    refreshCollectionDocuments = createRefreshCollectionDocuments(rootSelector, { sliceName, actions }, prepare)
  })

  it('should create a thunk action', () => {
    // act
    const thunkAction = refreshCollectionDocuments({ bucketId: 'testBucketId' })

    // assert
    expect(thunkAction).toBeFunction()
  })

  it('should call the database to get the collection documents undefined last update if collection does not exist', async () => {
    // arrange
    bucketsState.buckets.testBucketId.collections = {}
    const thunkAction = refreshCollectionDocuments({ bucketId: 'testBucketId' })

    // act
    await thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    expect(database.getDocs).toHaveBeenCalledWith(
      expect.any(String),
      { bucket: sliceName, bucketId: 'testBucketId', collection: 'testCases' },
      undefined,
    )
  })

  it.each`
    lastUpdate
    ${undefined}
    ${1234}
  `(
    'should call the database to get the collection documents with stored last update $lastUpdate',
    async ({ lastUpdate }) => {
      // arrange
      bucketsState.buckets.testBucketId.collections.testCases = {
        ids: [],
        entities: {},
        lastUpdate,
      }
      const thunkAction = refreshCollectionDocuments({ bucketId: 'testBucketId' })

      // act
      await thunkAction(dispatch, () => 'state', { database, thunkLogs })

      // assert
      expect(database.getDocs).toHaveBeenCalledWith(
        expect.any(String),
        { bucket: sliceName, bucketId: 'testBucketId', collection: 'testCases' },
        lastUpdate,
      )
    },
  )

  it('should dispatch nothing, if the database returns no results', async () => {
    // arrange
    database.getDocs = () => EMPTY
    const thunkAction = refreshCollectionDocuments({ bucketId: 'testBucketId' })

    // act
    await thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('should dispatch upsertCollection for each chunk returned by database', async () => {
    // arrange
    const results = [
      { lastUpdate: 1, doc: { id: '1', rev: 1, info: 'chunk1' } },
      { lastUpdate: 2, doc: { id: '2', rev: 2, info: 'chunk1' } },
      { lastUpdate: 3, doc: { id: '3', rev: 3, info: 'chunk2' } }, //
    ]
    database.getDocs = () => of(...results).pipe(bufferCount(2))
    const thunkAction = refreshCollectionDocuments({ bucketId: 'testBucketId' })

    // act
    await thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      upsertCollection({
        bucketId: 'testBucketId',
        collectionName: 'testCases',
        documents: [results[0].doc, results[1].doc],
        deleted: [],
        lastUpdate: 2,
      }),
    )
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      upsertCollection({
        bucketId: 'testBucketId',
        collectionName: 'testCases',
        documents: [results[2].doc],
        deleted: [],
        lastUpdate: 3,
      }),
    )
  })

  it('should dispatch upsertCollection with deleted ids, if the database returns deleted documents', async () => {
    // arrange
    const results = [
      { lastUpdate: 1, doc: { id: '1', rev: 1, info: 'chunk1' } },
      { lastUpdate: 2, doc: { id: '2', rev: 2, info: 'chunk1', __deleted: true } },
      { lastUpdate: 3, doc: { id: '3', rev: 3, info: 'chunk2', __deleted: true } }, //
    ]
    database.getDocs = () => of(...results).pipe(bufferCount(2))
    const thunkAction = refreshCollectionDocuments({ bucketId: 'testBucketId' })

    // act
    await thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      upsertCollection({
        bucketId: 'testBucketId',
        collectionName: 'testCases',
        documents: [results[0].doc],
        deleted: [results[1].doc.id],
        lastUpdate: 2,
      }),
    )
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      upsertCollection({
        bucketId: 'testBucketId',
        collectionName: 'testCases',
        documents: [],
        deleted: [results[2].doc.id],
        lastUpdate: 3,
      }),
    )
  })
})

describe('createPushCollectionDocument', () => {
  let pushCollectionDocument: ThunkActionCreatorWithPayload<{ bucketId: string; doc: TestDoc }>

  beforeEach(() => {
    const prepare = ({ bucketId, doc }: { bucketId: string; doc: TestDoc }) => ({
      bucketId,
      collectionName: 'testCases' as const,
      document: doc,
    })
    pushCollectionDocument = createPushCollectionDocument('my-opp', { sliceName, actions }, prepare)
  })

  it('should create a thunk action', () => {
    // act
    const thunkAction = pushCollectionDocument({ bucketId: 'testBucketId', doc: { id: '1', rev: 1, info: 'test' } })

    // assert
    expect(thunkAction).toBeFunction()
  })

  it('should call the database to put the document', async () => {
    // arrange
    const thunkAction = pushCollectionDocument({ bucketId: 'testBucketId', doc: { id: '1', rev: 1, info: 'test' } })

    // act
    await thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    expect(database.putDoc).toHaveBeenCalledWith(
      expect.any(String),
      { bucket: sliceName, bucketId: 'testBucketId', collection: 'testCases' },
      { id: '1', rev: 1, info: 'test' },
    )
  })

  it('should dispatch upsertCollection with the document returned by the database but skip lastUpdate', async () => {
    // arrange
    const doc = { id: '1', rev: 1, info: 'test' }
    database.putDoc = () => Promise.resolve({ lastUpdate: 1, doc })
    const thunkAction = pushCollectionDocument({ bucketId: 'testBucketId', doc })

    // act
    await thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    expect(dispatch).toHaveBeenCalledWith(
      upsertCollection({
        bucketId: 'testBucketId',
        collectionName: 'testCases',
        documents: [doc],
      }),
    )
  })

  it('should dispatch upsertCollection with the deleted document returned by the database', async () => {
    // arrange
    const doc = { id: '1', rev: 1, info: 'test', __deleted: true }
    database.putDoc = () => Promise.resolve({ lastUpdate: 1, doc })
    const thunkAction = pushCollectionDocument({ bucketId: 'testBucketId', doc })

    // act
    await thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    expect(dispatch).toHaveBeenCalledWith(
      upsertCollection({
        bucketId: 'testBucketId',
        collectionName: 'testCases',
        deleted: [doc.id],
      }),
    )
  })

  it('should reject the promise, if the database throws an error', async () => {
    // arrange
    const error = new Error('test error')
    database.putDoc = () => Promise.reject(error)
    const thunkAction = pushCollectionDocument({ bucketId: 'testBucketId', doc: { id: '1', rev: 1, info: 'test' } })

    // act
    const promise = thunkAction(dispatch, () => 'state', { database, thunkLogs })

    // assert
    await expect(promise).rejects.toThrow(error)
  })
})
