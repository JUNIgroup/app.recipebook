import { lastValueFrom, mergeMap } from 'rxjs'
import { collectFrom } from '../../../utilities/rx/rx.test-helper'
import { FirestoreOptions, FirestoreRestService } from '../../../infrastructure/firestore/firestore-rest-service'
import { isEmulatorAvailable } from '../../../utilities/firebase/emulator-utils'
import { FirestoreTestHelper, endTime, startTime } from '../../../utilities/firebase/firestore.test-helper'
import { Logger } from '../../../utilities/logger/api'
import { createFakeLogger } from '../../../utilities/logger/fake-logger.test-helper'
import { FirestoreDatabase } from './firestore-database'
import { FirestoreMockService } from './firestore-mock-service'
import { FirestoreService } from './firestore-service.api'

const emulatorAvailable = await isEmulatorAvailable()
const firestoreEmulator = emulatorAvailable?.firestore

const PREFIX = 'FirestoreDatabase-spec'

type ClearAllFn = () => void | Promise<void>

function mockFirestoreService(): { firestoreService: FirestoreService; clearAll: ClearAllFn } {
  const firestoreService = new FirestoreMockService()
  const clearAll = () => firestoreService.mockData.clear()
  return { firestoreService, clearAll }
}

function emulatorFirestoreService(): { firestoreService: FirestoreService; clearAll: ClearAllFn } {
  const { host: firestoreHost = '', port: firestorePort = 0 } = firestoreEmulator ?? {}
  const options: FirestoreOptions = {
    apiEndpoint: `http://${firestoreHost}:${firestorePort}/v1`,
    apiKey: 'dummy-key',
    projectId: import.meta.env.VITE_FIREBASE__PROJECT_ID,
    databaseId: '(default)',
  }
  const firestoreService = new FirestoreRestService(createFakeLogger(), options)
  const clearAll = async () => {
    const helper = new FirestoreTestHelper(firestoreHost, firestorePort, options.projectId, options.databaseId)
    await helper.deleteEmulatorCollections(
      `${PREFIX}-empty`,
      `${PREFIX}-one`,
      `${PREFIX}-one-sub/test/sub`,
      `${PREFIX}-all`,
      `${PREFIX}-all-sub/test/sub`,
      `${PREFIX}-update`,
      `${PREFIX}-update-sub/test/sub`,
      `${PREFIX}-put-new`,
      `${PREFIX}-put-new-sub/test/sub`,
      `${PREFIX}-put-update`,
      `${PREFIX}-put-update-sub/test/sub`,
      `${PREFIX}-put-return`,
      `${PREFIX}-put-return-sub/test/sub`,
      `${PREFIX}-put-return-update`,
      `${PREFIX}-put-return-update-sub/test/sub`,
    )
  }
  return { firestoreService, clearAll }
}

describe('FirestoreDatabase', () => {
  let logger: Logger<'business'>

  beforeEach(() => {
    logger = createFakeLogger({ console: true })
  })

  it('should initialize', async () => {
    // act
    const db = new FirestoreDatabase(logger, new FirestoreMockService())

    // assert
    expect(db).toBeDefined()
  })

  it(`should create 'business' log with class name`, async () => {
    // arrange
    const mockLogger = vi.fn().mockImplementation(logger)

    // act
    // eslint-disable-next-line no-new
    new FirestoreDatabase(mockLogger, new FirestoreMockService())

    // assert
    expect(mockLogger).toHaveBeenCalledWith(`business:${FirestoreDatabase.name}`)
  })

  const factories = [
    { factory: mockFirestoreService, available: true },
    { factory: emulatorFirestoreService, available: !!firestoreEmulator },
  ]

  factories.forEach(({ factory, available }) =>
    describe.runIf(available)(`with ${factory.name}`, () => {
      const operationCode = '«test»'

      let firestoreService: FirestoreService
      let clearAll: ClearAllFn
      let db: FirestoreDatabase

      beforeAll(async () => {
        const context = factory()
        firestoreService = context.firestoreService
        clearAll = context.clearAll
        await clearAll()
      })

      beforeEach(() => {
        db = new FirestoreDatabase(logger, firestoreService)
      })

      describe('.getDocs', () => {
        it('should return an empty observable for an empty bucket', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-empty` }

          // act
          const result = await collectFrom(db.getDocs(operationCode, path))

          // assert
          expect(result).toBeEmpty()
        })

        it('should return an empty observable for an empty bucket collection', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-empty`, bucketId: 'test', collection: 'sub' }

          // act
          const result = await collectFrom(db.getDocs(operationCode, path))

          // assert
          expect(result).toBeEmpty()
        })

        it('should emit the one and only document of a bucket', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-one` }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          await firestoreService.writeDoc(operationCode, [path.bucket, doc.id], doc)

          // act
          const result = await collectFrom(db.getDocs(operationCode, path))

          // assert
          expect(result.flat()).toEqual([
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'foo', rev: 1, content: { bar: 'baz' } },
            },
          ])
        })

        it('should emit the one and only document of a bucket collection', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-one-sub`, bucketId: 'test', collection: 'sub' }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          await firestoreService.writeDoc(operationCode, [path.bucket, path.bucketId, path.collection, doc.id], doc)

          // act
          const result = await collectFrom(db.getDocs(operationCode, path))

          // assert
          expect(result.flat()).toEqual([
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'foo', rev: 1, content: { bar: 'baz' } },
            },
          ])
        })

        it('should emit all documents of a bucket (no after argument)', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-all` }
          const doc1 = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          const doc2 = { id: 'bar', rev: 2, content: { baz: 'foo' } }
          const doc3 = { id: 'baz', rev: 3, content: { foo: 'bar' } }
          await firestoreService.writeDoc(operationCode, [path.bucket, doc1.id], doc1)
          await firestoreService.writeDoc(operationCode, [path.bucket, doc2.id], doc2)
          await firestoreService.writeDoc(operationCode, [path.bucket, doc3.id], doc3)

          // act
          const result = await collectFrom(db.getDocs(operationCode, path))

          // assert
          expect(result.flat()).toEqual([
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'foo', rev: 1, content: { bar: 'baz' } },
            },
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'bar', rev: 2, content: { baz: 'foo' } },
            },
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'baz', rev: 3, content: { foo: 'bar' } },
            },
          ])
        })

        it('should emit all documents of a bucket collection (no after argument)', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-all-sub`, bucketId: 'test', collection: 'sub' }
          const doc1 = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          const doc2 = { id: 'bar', rev: 2, content: { baz: 'foo' } }
          const doc3 = { id: 'baz', rev: 3, content: { foo: 'bar' } }
          await firestoreService.writeDoc(operationCode, [path.bucket, path.bucketId, path.collection, doc1.id], doc1)
          await firestoreService.writeDoc(operationCode, [path.bucket, path.bucketId, path.collection, doc2.id], doc2)
          await firestoreService.writeDoc(operationCode, [path.bucket, path.bucketId, path.collection, doc3.id], doc3)

          // act
          const result = await collectFrom(db.getDocs(operationCode, path))

          // assert
          expect(result.flat()).toEqual([
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'foo', rev: 1, content: { bar: 'baz' } },
            },
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'bar', rev: 2, content: { baz: 'foo' } },
            },
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'baz', rev: 3, content: { foo: 'bar' } },
            },
          ])
        })

        it('should emit only documents of a bucket updated after the given time', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-update` }
          const doc1 = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          const doc2 = { id: 'bar', rev: 2, content: { baz: 'foo' } }
          await firestoreService.writeDoc(operationCode, [path.bucket, doc1.id], doc1)
          await firestoreService.writeDoc(operationCode, [path.bucket, doc2.id], doc2)

          const { lastUpdate } = await lastValueFrom(
            firestoreService.readDocs(operationCode, [path.bucket]).pipe(mergeMap((batch) => batch)),
          )
          await delay(10)

          const doc3 = { id: 'baz', rev: 3, content: { foo: 'bar' } }
          const update2 = { ...doc2, rev: 3, content: { baz: 'foo-update' } }
          await firestoreService.writeDoc(operationCode, [path.bucket, update2.id], update2)
          await firestoreService.writeDoc(operationCode, [path.bucket, doc3.id], doc3)

          // act
          const result = await collectFrom(db.getDocs(operationCode, path, lastUpdate))

          // assert
          expect(result.flat()).toEqual([
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'bar', rev: 3, content: { baz: 'foo-update' } },
            },
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'baz', rev: 3, content: { foo: 'bar' } },
            },
          ])
        })

        it('should emit only documents of a bucket collection updated after the given time', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-update-sub`, bucketId: 'test', collection: 'sub' }
          const doc1 = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          const doc2 = { id: 'bar', rev: 2, content: { baz: 'foo' } }
          await firestoreService.writeDoc(operationCode, [path.bucket, path.bucketId, path.collection, doc1.id], doc1)
          await firestoreService.writeDoc(operationCode, [path.bucket, path.bucketId, path.collection, doc2.id], doc2)

          const { lastUpdate } = await lastValueFrom(
            firestoreService
              .readDocs(operationCode, [path.bucket, path.bucketId, path.collection])
              .pipe(mergeMap((batch) => batch)),
          )
          await delay(10)

          const update2 = { ...doc2, rev: 3, content: { baz: 'foo-update' } }
          const doc3 = { id: 'baz', rev: 3, content: { foo: 'bar' } }
          await firestoreService.writeDoc(
            operationCode,
            [path.bucket, path.bucketId, path.collection, update2.id],
            update2,
          )
          await firestoreService.writeDoc(operationCode, [path.bucket, path.bucketId, path.collection, doc3.id], doc3)

          // act
          const result = await collectFrom(db.getDocs(operationCode, path, lastUpdate))

          // assert
          expect(result.flat()).toEqual([
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'bar', rev: 3, content: { baz: 'foo-update' } },
            },
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'baz', rev: 3, content: { foo: 'bar' } },
            },
          ])
        })
      })

      describe('.putDoc', () => {
        it('should add a new bucket document', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-new` }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }

          // act
          const start = startTime()
          await db.putDoc(operationCode, path, doc)
          const end = endTime()

          // assert
          const document = await firestoreService.readDoc(operationCode, [path.bucket, doc.id])
          expect(document).toEqual({
            lastUpdate: expect.any(Number),
            doc: { id: 'foo', rev: 1, content: { bar: 'baz' } },
          })
          expect(document.lastUpdate).toBeBetween(start, end)
        })

        it('should add a new bucket collection document', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-new-sub`, bucketId: 'test', collection: 'sub' }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }

          // act
          const start = startTime()
          await db.putDoc(operationCode, path, doc)
          const end = endTime()

          // assert
          const document = await firestoreService.readDoc(operationCode, [
            path.bucket,
            path.bucketId,
            path.collection,
            doc.id,
          ])
          expect(document).toEqual({
            lastUpdate: expect.any(Number),
            doc: { id: 'foo', rev: 1, content: { bar: 'baz' } },
          })
          expect(document.lastUpdate).toBeBetween(start, end)
        })

        it('should update an existing bucket document', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-update` }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          await firestoreService.writeDoc(operationCode, [path.bucket, doc.id], doc)

          const update = { ...doc, rev: 2, content: { bar: 'baz-update' } }

          // act
          const start = startTime()
          await db.putDoc(operationCode, path, update)
          const end = endTime()

          // assert
          const document = await firestoreService.readDoc(operationCode, [path.bucket, doc.id])
          expect(document).toEqual({
            lastUpdate: expect.any(Number),
            doc: { id: 'foo', rev: 2, content: { bar: 'baz-update' } },
          })
          expect(document.lastUpdate).toBeBetween(start, end)
        })

        it('should update an existing bucket collection document', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-update-sub`, bucketId: 'test', collection: 'sub' }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          await firestoreService.writeDoc(operationCode, [path.bucket, path.bucketId, path.collection, doc.id], doc)

          const update = { ...doc, rev: 2, content: { bar: 'baz-update' } }

          // act
          const start = startTime()
          await db.putDoc(operationCode, path, update)
          const end = endTime()

          // assert
          const document = await firestoreService.readDoc(operationCode, [
            path.bucket,
            path.bucketId,
            path.collection,
            doc.id,
          ])
          expect(document).toEqual({
            lastUpdate: expect.any(Number),
            doc: { id: 'foo', rev: 2, content: { bar: 'baz-update' } },
          })
          expect(document.lastUpdate).toBeBetween(start, end)
        })

        it('should return the written bucket document', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-return` }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }

          // act
          const result = await db.putDoc(operationCode, path, doc)

          // assert
          const expected = await firestoreService.readDoc(operationCode, [path.bucket, doc.id])
          expect(result).toEqual(expected)
        })

        it('should return the written bucket collection document', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-return-sub`, bucketId: 'test', collection: 'sub' }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }

          // act
          const result = await db.putDoc(operationCode, path, doc)

          // assert
          const expected = await firestoreService.readDoc(operationCode, [
            path.bucket,
            path.bucketId,
            path.collection,
            doc.id,
          ])
          expect(result).toEqual(expected)
        })

        it('should return the written bucket document with the updated lastUpdate', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-return-update` }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          await firestoreService.writeDoc(operationCode, [path.bucket, doc.id], doc)

          const update = { ...doc, rev: 2, content: { bar: 'baz-update' } }

          // act
          const result = await db.putDoc(operationCode, path, update)

          // assert
          const expected = await firestoreService.readDoc(operationCode, [path.bucket, doc.id])
          expect(result).toEqual(expected)
        })

        it('should return the written bucket collection document with the updated lastUpdate', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-return-update-sub`, bucketId: 'test', collection: 'sub' }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          await firestoreService.writeDoc(operationCode, [path.bucket, path.bucketId, path.collection, doc.id], doc)

          const update = { ...doc, rev: 2, content: { bar: 'baz-update' } }

          // act
          const result = await db.putDoc(operationCode, path, update)

          // assert
          const expected = await firestoreService.readDoc(operationCode, [
            path.bucket,
            path.bucketId,
            path.collection,
            doc.id,
          ])
          expect(result).toEqual(expected)
        })
      })
    }),
  )
})

function delay(timeInMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeInMs)
  })
}
