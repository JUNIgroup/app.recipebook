import { lastValueFrom, map, max } from 'rxjs'
import { collectFrom } from '../../../../infrastructure/database/helpers/collect-from'
import { FirestoreOptions, FirestoreRestService } from '../../../../infrastructure/firestore/firestore-rest-service'
import { isEmulatorAvailable } from '../../../../utilities/firebase/emulator-utils'
import { FirestoreTestHelper } from '../../../../utilities/firebase/firestore.test-helper'
import { Logger } from '../../../../utilities/logger/api'
import { createFakeLogger } from '../../../../utilities/logger/fake-logger.test-helper'
import { FirestoreDatabase } from './firestore-database'
import { FirestoreMockService } from './firestore-mock-service'
import { FirestoreService } from './firestore-service.api'

const emulatorAvailable = await isEmulatorAvailable()
const firestoreEmulator = emulatorAvailable?.firestore

const PREFIX = 'FirestoreDatabase'

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
      `${PREFIX}-del`,
      `${PREFIX}-del-sub/test/sub`,
      `${PREFIX}-del-one`,
      `${PREFIX}-del-one-sub/test/sub`,
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

  const factories = [
    { factory: mockFirestoreService, available: true },
    { factory: emulatorFirestoreService, available: !!firestoreEmulator },
  ]

  factories.forEach(({ factory, available }) =>
    describe.runIf(available)(`with ${factory.name}`, () => {
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
          const result = await collectFrom(db.getDocs(path))

          // assert
          expect(result).toBeEmpty()
        })

        it('should return an empty observable for an empty bucket collection', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-empty`, bucketId: 'test', collection: 'sub' }

          // act
          const result = await collectFrom(db.getDocs(path))

          // assert
          expect(result).toBeEmpty()
        })

        it('should emit the one and only document of a bucket', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-one` }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          await firestoreService.writeDoc([path.bucket, doc.id], doc)

          // act
          const result = await collectFrom(db.getDocs(path))

          // assert
          expect(result).toEqual([
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
          await firestoreService.writeDoc([path.bucket, path.bucketId, path.collection, doc.id], doc)

          // act
          const result = await collectFrom(db.getDocs(path))

          // assert
          expect(result).toEqual([
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
          await firestoreService.writeDoc([path.bucket, doc1.id], doc1)
          await firestoreService.writeDoc([path.bucket, doc2.id], doc2)
          await firestoreService.writeDoc([path.bucket, doc3.id], doc3)

          // act
          const result = await collectFrom(db.getDocs(path))

          // assert
          result.sort(byNumber((doc) => doc.lastUpdate))
          expect(result).toEqual([
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
          await firestoreService.writeDoc([path.bucket, path.bucketId, path.collection, doc1.id], doc1)
          await firestoreService.writeDoc([path.bucket, path.bucketId, path.collection, doc2.id], doc2)
          await firestoreService.writeDoc([path.bucket, path.bucketId, path.collection, doc3.id], doc3)

          // act
          const result = await collectFrom(db.getDocs(path))

          // assert
          result.sort(byNumber((doc) => doc.lastUpdate))
          expect(result).toEqual([
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
          await firestoreService.writeDoc([path.bucket, doc1.id], doc1)
          await firestoreService.writeDoc([path.bucket, doc2.id], doc2)

          const lastUpdate = await lastValueFrom(
            firestoreService.readDocs([path.bucket]).pipe(
              map((doc) => doc.lastUpdate),
              max(),
            ),
          )
          await delay(10)

          const doc3 = { id: 'baz', rev: 3, content: { foo: 'bar' } }
          const update2 = { ...doc2, rev: 3, content: { baz: 'foo-update' } }
          await firestoreService.writeDoc([path.bucket, update2.id], update2)
          await firestoreService.writeDoc([path.bucket, doc3.id], doc3)

          // act
          const result = await collectFrom(db.getDocs(path, lastUpdate))

          // assert
          result.sort(byNumber((doc) => doc.lastUpdate))
          expect(result).toEqual([
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
          await firestoreService.writeDoc([path.bucket, path.bucketId, path.collection, doc1.id], doc1)
          await firestoreService.writeDoc([path.bucket, path.bucketId, path.collection, doc2.id], doc2)

          const lastUpdate = await lastValueFrom(
            firestoreService.readDocs([path.bucket, path.bucketId, path.collection]).pipe(
              map((doc) => doc.lastUpdate),
              max(),
            ),
          )
          await delay(10)

          const update2 = { ...doc2, rev: 3, content: { baz: 'foo-update' } }
          const doc3 = { id: 'baz', rev: 3, content: { foo: 'bar' } }
          await firestoreService.writeDoc([path.bucket, path.bucketId, path.collection, update2.id], update2)
          await firestoreService.writeDoc([path.bucket, path.bucketId, path.collection, doc3.id], doc3)

          // act
          const result = await collectFrom(db.getDocs(path, lastUpdate))

          // assert
          result.sort(byNumber((doc) => doc.lastUpdate))
          expect(result).toEqual([
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
          const startTime = new Date()

          // act
          await db.putDoc(path, doc)

          // assert
          const finishTime = new Date()
          const document = await firestoreService.readDoc([path.bucket, doc.id])
          expect(document).toEqual({
            lastUpdate: expect.any(Number),
            doc: { id: 'foo', rev: 1, content: { bar: 'baz' } },
          })
          expect(document.lastUpdate).toBeBetween(startTime, finishTime)
        })

        it('should add a new bucket collection document', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-new-sub`, bucketId: 'test', collection: 'sub' }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          const startTime = new Date()

          // act
          await db.putDoc(path, doc)

          // assert
          const finishTime = new Date()
          const document = await firestoreService.readDoc([path.bucket, path.bucketId, path.collection, doc.id])
          expect(document).toEqual({
            lastUpdate: expect.any(Number),
            doc: { id: 'foo', rev: 1, content: { bar: 'baz' } },
          })
          expect(document.lastUpdate).toBeBetween(startTime, finishTime)
        })

        it('should update an existing bucket document', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-update` }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          await firestoreService.writeDoc([path.bucket, doc.id], doc)

          const update = { ...doc, rev: 2, content: { bar: 'baz-update' } }
          const startTime = new Date()

          // act
          await db.putDoc(path, update)

          // assert
          const finishTime = new Date()
          const document = await firestoreService.readDoc([path.bucket, doc.id])
          expect(document).toEqual({
            lastUpdate: expect.any(Number),
            doc: { id: 'foo', rev: 2, content: { bar: 'baz-update' } },
          })
          expect(document.lastUpdate).toBeBetween(startTime, finishTime)
        })

        it('should update an existing bucket collection document', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-update-sub`, bucketId: 'test', collection: 'sub' }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          await firestoreService.writeDoc([path.bucket, path.bucketId, path.collection, doc.id], doc)

          const update = { ...doc, rev: 2, content: { bar: 'baz-update' } }
          const startTime = new Date()

          // act
          await db.putDoc(path, update)

          // assert
          const finishTime = new Date()
          const document = await firestoreService.readDoc([path.bucket, path.bucketId, path.collection, doc.id])
          expect(document).toEqual({
            lastUpdate: expect.any(Number),
            doc: { id: 'foo', rev: 2, content: { bar: 'baz-update' } },
          })
          expect(document.lastUpdate).toBeBetween(startTime, finishTime)
        })

        it('should return the written bucket document', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-return` }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }

          // act
          const result = await db.putDoc(path, doc)

          // assert
          const expected = await firestoreService.readDoc([path.bucket, doc.id])
          expect(result).toEqual(expected)
        })

        it('should return the written bucket collection document', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-return-sub`, bucketId: 'test', collection: 'sub' }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }

          // act
          const result = await db.putDoc(path, doc)

          // assert
          const expected = await firestoreService.readDoc([path.bucket, path.bucketId, path.collection, doc.id])
          expect(result).toEqual(expected)
        })

        it('should return the written bucket document with the updated lastUpdate', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-return-update` }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          await firestoreService.writeDoc([path.bucket, doc.id], doc)

          const update = { ...doc, rev: 2, content: { bar: 'baz-update' } }

          // act
          const result = await db.putDoc(path, update)

          // assert
          const expected = await firestoreService.readDoc([path.bucket, doc.id])
          expect(result).toEqual(expected)
        })

        it('should return the written bucket collection document with the updated lastUpdate', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-put-return-update-sub`, bucketId: 'test', collection: 'sub' }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          await firestoreService.writeDoc([path.bucket, path.bucketId, path.collection, doc.id], doc)

          const update = { ...doc, rev: 2, content: { bar: 'baz-update' } }

          // act
          const result = await db.putDoc(path, update)

          // assert
          const expected = await firestoreService.readDoc([path.bucket, path.bucketId, path.collection, doc.id])
          expect(result).toEqual(expected)
        })
      })

      describe('.delDoc', () => {
        it('should delete an existing bucket document', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-del` }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          await firestoreService.writeDoc([path.bucket, doc.id], doc)

          // act
          await db.delDoc(path, doc)

          // assert
          const documents = await collectFrom(firestoreService.readDocs([path.bucket]))
          expect(documents).toBeEmpty()
        })

        it('should delete an existing bucket collection document', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-del-sub`, bucketId: 'test', collection: 'sub' }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          await firestoreService.writeDoc([path.bucket, path.bucketId, path.collection, doc.id], doc)

          // act
          await db.delDoc(path, doc)

          // assert
          const documents = await collectFrom(firestoreService.readDocs([path.bucket, path.bucketId, path.collection]))
          expect(documents).toBeEmpty()
        })

        it('should do nothing if the bucket document does not exist', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-del` }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }

          // act
          await db.delDoc(path, doc)

          // assert
          const documents = await collectFrom(firestoreService.readDocs([path.bucket]))
          expect(documents).toBeEmpty()
        })

        it('should do nothing if the bucket collection document does not exist', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-del-sub`, bucketId: 'test', collection: 'sub' }
          const doc = { id: 'foo', rev: 1, content: { bar: 'baz' } }

          // act
          await db.delDoc(path, doc)

          // assert
          const documents = await collectFrom(firestoreService.readDocs([path.bucket, path.bucketId, path.collection]))
          expect(documents).toBeEmpty()
        })

        it('should not delete other bucket documents', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-del-one` }
          const doc1 = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          const doc2 = { id: 'bar', rev: 2, content: { baz: 'foo' } }
          await firestoreService.writeDoc([path.bucket, doc1.id], doc1)
          await firestoreService.writeDoc([path.bucket, doc2.id], doc2)

          // act
          await db.delDoc(path, doc1)

          // assert
          const documents = await collectFrom(firestoreService.readDocs([path.bucket]))
          expect(documents).toEqual([
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'bar', rev: 2, content: { baz: 'foo' } },
            },
          ])
        })

        it('should not delete other bucket collection documents', async () => {
          // arrange
          const path = { bucket: `${PREFIX}-del-one-sub`, bucketId: 'test', collection: 'sub' }
          const doc1 = { id: 'foo', rev: 1, content: { bar: 'baz' } }
          const doc2 = { id: 'bar', rev: 2, content: { baz: 'foo' } }
          await firestoreService.writeDoc([path.bucket, path.bucketId, path.collection, doc1.id], doc1)
          await firestoreService.writeDoc([path.bucket, path.bucketId, path.collection, doc2.id], doc2)

          // act
          await db.delDoc(path, doc1)

          // assert
          const documents = await collectFrom(firestoreService.readDocs([path.bucket, path.bucketId, path.collection]))
          expect(documents).toEqual([
            {
              lastUpdate: expect.any(Number),
              doc: { id: 'bar', rev: 2, content: { baz: 'foo' } },
            },
          ])
        })
      })
    }),
  )
})

function byNumber<T>(extractor: (value: T) => number) {
  return (a: T, b: T) => extractor(a) - extractor(b)
}

function delay(timeInMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeInMs)
  })
}
