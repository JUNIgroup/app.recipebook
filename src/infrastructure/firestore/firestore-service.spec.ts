import { ulid } from 'ulid'
import { Logger } from '../../utilities/logger'
import { createFakeLogger } from '../../utilities/logger/fake-logger.test-helper'
import { collectFrom } from '../database/helpers/collect-from'
import { isEmulatorAvailable } from '../firebase/helpers/emulator-utils'
import { FirestoreService } from './firestore-service'
import { FirestoreTestHelper } from './firestore.test-helper'

const emulatorAvailable = await isEmulatorAvailable()
const firestoreEmulator = emulatorAvailable?.firestore

function byNumber<T>(extractor: (value: T) => number) {
  return (a: T, b: T) => extractor(a) - extractor(b)
}

describe.runIf(firestoreEmulator)('FirestoreService', () => {
  assert(firestoreEmulator, 'Firestore emulator is not available')

  const projectId = import.meta.env.VITE_FIREBASE__PROJECT_ID
  const databaseId = '(default)'
  const endpoint = `http://${firestoreEmulator.host}:${firestoreEmulator.port}/v1/projects/${projectId}/databases/${databaseId}/documents`
  const testHelper = new FirestoreTestHelper(firestoreEmulator.host, firestoreEmulator.port, projectId, databaseId)

  const collections = [
    'Col-Empty',
    'Col-Empty',
    'Col-Empty/d1/Col-Sub1',
    'Col-Empty/d1/Col-Sub1/d2/Col-Sub2',
    'Col-Single',
    'Col-Single/d1/Col-Sub1',
    'Col-Single/d1/Col-Sub1/d2/Col-Sub2',
    'Col-Multiple',
    'Col-Multiple/d1/Col-Sub1',
    'Col-Multiple/d1/Col-Sub1/d2/Col-Sub2',
    'Col-Updates',
    'Col-Updates/d1/Col-Sub1',
    'Col-Updates/d1/Col-Sub1/d2/Col-Sub2',
    'Col-Put',
    'Col-Put/d1/Col-Sub1',
    'Col-Put/d1/Col-Sub1/d2/Col-Sub2',
  ]

  let logger: Logger<'infra'>

  beforeEach(() => {
    logger = createFakeLogger({ console: true })
  })

  beforeAll(async () => {
    await testHelper.deleteEmulatorCollections(...collections)
  })

  it('should initialize', async () => {
    // act
    const db = new FirestoreService(logger, endpoint)

    // assert
    expect(db).toBeDefined()
  })

  describe('getDocs', () => {
    let db: FirestoreService

    beforeEach(() => {
      db = new FirestoreService(logger, endpoint)
    })

    describe('root collection', () => {
      it.each`
        pathString
        ${'Col-Empty'}
        ${'Col-Empty/d1/Col-Sub1'}
        ${'Col-Empty/d1/Col-Sub1/d2/Col-Sub2'}
      `('should return an empty observable of collection $pathString', async ({ pathString }) => {
        // arrange
        const path = pathString.split('/')

        // act
        const result = await collectFrom(db.getDocs(path))

        // assert
        expect(result).toBeEmpty()
      })

      it.each`
        pathString
        ${'Col-Single'}
        ${'Col-Single/d1/Col-Sub1'}
        ${'Col-Single/d1/Col-Sub1/d2/Col-Sub2'}
      `('should emit the one and only document of $pathString', async ({ pathString }) => {
        // arrange
        const path = pathString.split('/')
        const after = undefined
        const randomString = ulid()
        await testHelper.patchDocument(`${pathString}/doc-id`, {
          fields: {
            foo: { stringValue: randomString },
            more: { mapValue: { fields: { bar: { stringValue: 'baz' } } } },
          },
        })

        // act
        const result = await collectFrom(db.getDocs(path, after))

        // assert
        expect(result).toEqual([
          {
            lastUpdate: expect.any(Number),
            doc: {
              foo: randomString,
              more: { bar: 'baz' },
            },
          },
        ])
      })

      it.each`
        pathString
        ${'Col-Multiple'}
        ${'Col-Multiple/d1/Col-Sub1'}
        ${'Col-Multiple/d1/Col-Sub1/d2/Col-Sub2'}
      `('should emit all documents of $pathString', async ({ pathString }) => {
        // arrange
        const path = pathString.split('/')
        const randomString1 = ulid()
        await testHelper.patchDocument(`${pathString}/foo`, {
          fields: {
            foo: { stringValue: randomString1 },
            bar: { integerValue: 1 },
          },
        })
        const randomString2 = ulid()
        await testHelper.patchDocument(`${pathString}/bar`, {
          fields: {
            foo: { stringValue: randomString2 },
            bar: { integerValue: 2 },
          },
        })
        const randomString3 = ulid()
        await testHelper.patchDocument(`${pathString}/baz`, {
          fields: {
            foo: { stringValue: randomString3 },
            bar: { integerValue: 3 },
          },
        })

        // act
        const results = await collectFrom(db.getDocs(path))

        // assert
        results.sort(byNumber((result) => result.lastUpdate))
        expect(results).toEqual([
          {
            lastUpdate: expect.any(Number),
            doc: { foo: randomString1, bar: 1 },
          },
          {
            lastUpdate: expect.any(Number),
            doc: { foo: randomString2, bar: 2 },
          },
          {
            lastUpdate: expect.any(Number),
            doc: { foo: randomString3, bar: 3 },
          },
        ])
      })

      it.skip.each`
        pathString
        ${'Col-Updates'}
        ${'Col-Updates/d1/Col-Sub1'}
        ${'Col-Updates/d1/Col-Sub1/d2/Col-Sub2'}
      `('[not implemented yet] should emit only updated documents with time argument', async ({ pathString }) => {
        // arrange
        const path = pathString.split('/')
        const randomString1 = ulid()
        await testHelper.patchDocument(`${pathString}/foo`, {
          fields: {
            foo: { stringValue: randomString1 },
            bar: { integerValue: 1 },
          },
        })
        const randomString2 = ulid()
        await testHelper.patchDocument(`${pathString}/bar`, {
          fields: {
            foo: { stringValue: randomString2 },
            bar: { integerValue: 2 },
          },
        })
        const firstResults = await collectFrom(db.getDocs(path))
        const lastUpdate = firstResults.reduce((max, result) => Math.max(max, result.lastUpdate), 0)

        const randomString3 = ulid()
        await testHelper.patchDocument(`${pathString}/baz`, {
          fields: {
            foo: { stringValue: randomString3 },
            bar: { integerValue: 3 },
          },
        })

        // act
        const results = await collectFrom(db.getDocs(path, lastUpdate))

        // assert
        results.sort(byNumber((result) => result.lastUpdate))
        expect(results).toEqual([
          {
            lastUpdate: expect.any(Number),
            doc: { foo: randomString3, bar: 3 },
          },
        ])
      })
    })
  })

  describe('putDoc', () => {
    let db: FirestoreService

    beforeEach(() => {
      db = new FirestoreService(logger, endpoint)
    })

    it.each`
      pathString
      ${'Col-Put/doc-id-123'}
      ${'Col-Put/d1/Col-Sub1/doc-id-123'}
      ${'Col-Put/d1/Col-Sub1/d2/Col-Sub2/doc-id-123'}
    `('should add a new document $pathString', async ({ pathString }) => {
      // arrange
      const path = pathString.split('/')
      const doc = {
        foo: ulid(),
        bar: 1,
      }

      // act
      await db.putDoc(path, doc)

      // assert
      const document = await testHelper.getDocument(pathString)
      expect(document).toEqual({
        name: expect.stringMatching(/.*\/doc-id-123/),
        fields: {
          foo: { stringValue: doc.foo },
          bar: { integerValue: '1' },
        },
        createTime: expect.any(String),
        updateTime: expect.any(String),
      })
    })

    it.each`
      pathString
      ${'Col-Put/doc-id-345'}
      ${'Col-Put/d1/Col-Sub1/doc-id-345'}
      ${'Col-Put/d1/Col-Sub1/d2/Col-Sub2/doc-id-345'}
    `('should update an existing document $pathString', async ({ pathString }) => {
      // arrange
      const path = pathString.split('/')
      const doc = {
        foo: ulid(),
        bar: 1,
      }
      await db.putDoc(path, doc)
      const update = {
        ...doc,
        bar: 2,
      }

      // act
      await db.putDoc(path, update)

      // assert
      const document = await testHelper.getDocument(pathString)
      expect(document).toEqual({
        name: expect.stringMatching(/.*\/doc-id-345/),
        fields: {
          foo: { stringValue: doc.foo },
          bar: { integerValue: '2' },
        },
        createTime: expect.any(String),
        updateTime: expect.any(String),
      })
    })
  })
})
