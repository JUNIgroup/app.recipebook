import { ulid } from 'ulid'
import { Logger } from '../../utilities/logger'
import { createFakeLogger } from '../../utilities/logger/fake-logger.test-helper'
import { collectFrom } from '../database/helpers/collect-from'
import { isEmulatorAvailable } from '../firebase/helpers/emulator-utils'
import { FirestoreOptions, FirestoreRestService } from './firestore-rest-service'
import { FirestoreTestHelper } from './firestore.test-helper'

const emulatorAvailable = await isEmulatorAvailable()
const firestoreEmulator = emulatorAvailable?.firestore

function byNumber<T>(extractor: (value: T) => number) {
  return (a: T, b: T) => extractor(a) - extractor(b)
}

describe.runIf(firestoreEmulator)('FirestoreRestService', () => {
  const { host: firestoreHost = '', port: firestorePort = 0 } = firestoreEmulator ?? {}

  const options: FirestoreOptions = {
    apiEndpoint: `http://${firestoreHost}:${firestorePort}/v1`,
    apiKey: 'dummy-key',
    projectId: import.meta.env.VITE_FIREBASE__PROJECT_ID,
    databaseId: '(default)',
  }

  const testHelper = new FirestoreTestHelper(firestoreHost, firestorePort, options.projectId, options.databaseId)

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
    'Col-ReadWrite',
    'Col-ReadWrite/d1/Col-Sub1',
    'Col-ReadWrite/d1/Col-Sub1/d2/Col-Sub2',
    'Col-Delete',
    'Col-Delete/d1/Col-Sub1',
    'Col-Delete/d1/Col-Sub1/d2/Col-Sub2',
  ]

  let logger: Logger<'infra'>

  beforeEach(() => {
    logger = createFakeLogger()
  })

  beforeAll(async () => {
    await testHelper.deleteEmulatorCollections(...collections)
  })

  it('should initialize', async () => {
    // act
    const db = new FirestoreRestService(logger, options)

    // assert
    expect(db).toBeDefined()
  })

  describe('service', () => {
    let db: FirestoreRestService

    beforeEach(() => {
      db = new FirestoreRestService(logger, options)
    })

    describe('.readDocs', () => {
      it.each`
        pathString
        ${'Col-Empty'}
        ${'Col-Empty/d1/Col-Sub1'}
        ${'Col-Empty/d1/Col-Sub1/d2/Col-Sub2'}
      `('should return an empty observable of collection $pathString', async ({ pathString }) => {
        // arrange
        const path = pathString.split('/')

        // act
        const result = await collectFrom(db.readDocs(path))

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
        const requestTime = new Date()
        await testHelper.patchDocument(`${pathString}/doc-id`, {
          fields: {
            foo: { stringValue: randomString },
            more: { mapValue: { fields: { bar: { stringValue: 'baz' } } } },
            __lastUpdate: { timestampValue: requestTime.toISOString() },
          },
        })

        // act
        const result = await collectFrom(db.readDocs(path, after))

        // assert
        expect(result).toEqual([
          {
            lastUpdate: requestTime.getTime(),
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
        const requestTime1 = new Date()
        await testHelper.patchDocument(`${pathString}/foo`, {
          fields: {
            foo: { stringValue: randomString1 },
            bar: { integerValue: 1 },
            __lastUpdate: { timestampValue: requestTime1.toISOString() },
          },
        })
        const randomString2 = ulid()
        const requestTime2 = new Date()
        await testHelper.patchDocument(`${pathString}/bar`, {
          fields: {
            foo: { stringValue: randomString2 },
            bar: { integerValue: 2 },
            __lastUpdate: { timestampValue: requestTime2.toISOString() },
          },
        })
        const randomString3 = ulid()
        const requestTime3 = new Date()
        await testHelper.patchDocument(`${pathString}/baz`, {
          fields: {
            foo: { stringValue: randomString3 },
            bar: { integerValue: 3 },
            __lastUpdate: { timestampValue: requestTime3.toISOString() },
          },
        })

        // act
        const results = await collectFrom(db.readDocs(path))

        // assert
        results.sort(byNumber((result) => result.lastUpdate))
        expect(results).toEqual([
          {
            lastUpdate: requestTime1.getTime(),
            doc: { foo: randomString1, bar: 1 },
          },
          {
            lastUpdate: requestTime2.getTime(),
            doc: { foo: randomString2, bar: 2 },
          },
          {
            lastUpdate: requestTime3.getTime(),
            doc: { foo: randomString3, bar: 3 },
          },
        ])
      })

      it.each`
        pathString
        ${'Col-Updates'}
        ${'Col-Updates/d1/Col-Sub1'}
        ${'Col-Updates/d1/Col-Sub1/d2/Col-Sub2'}
      `('should emit only updated documents with time argument', async ({ pathString }) => {
        // arrange
        const path = pathString.split('/')
        const randomString1 = ulid()
        const requestTime1 = new Date()
        await testHelper.patchDocument(`${pathString}/foo`, {
          fields: {
            foo: { stringValue: randomString1 },
            bar: { integerValue: 1 },
            __lastUpdate: { timestampValue: requestTime1.toISOString() },
          },
        })
        const randomString2 = ulid()
        const requestTime2 = new Date()
        await testHelper.patchDocument(`${pathString}/bar`, {
          fields: {
            foo: { stringValue: randomString2 },
            bar: { integerValue: 2 },
            __lastUpdate: { timestampValue: requestTime2.toISOString() },
          },
        })

        const randomString1update = ulid()
        const requestTime1update = new Date()
        await testHelper.patchDocument(`${pathString}/foo`, {
          fields: {
            foo: { stringValue: randomString1update },
            bar: { integerValue: 1 },
            __lastUpdate: { timestampValue: requestTime1update.toISOString() },
          },
        })
        const randomString3 = ulid()
        const requestTime3 = new Date()
        await testHelper.patchDocument(`${pathString}/baz`, {
          fields: {
            foo: { stringValue: randomString3 },
            bar: { integerValue: 3 },
            __lastUpdate: { timestampValue: requestTime3.toISOString() },
          },
        })

        // act
        const results = await collectFrom(db.readDocs(path, requestTime2.getTime()))

        // assert
        results.sort(byNumber((result) => result.lastUpdate))
        expect(results).toEqual([
          {
            lastUpdate: requestTime1update.getTime(),
            doc: { foo: randomString1update, bar: 1 },
          },
          {
            lastUpdate: requestTime3.getTime(),
            doc: { foo: randomString3, bar: 3 },
          },
        ])
      })
    })

    describe('.writeDoc', () => {
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
        const begin = new Date()
        await db.writeDoc(path, doc)
        const end = new Date()

        // assert
        const document = await testHelper.getDocument(pathString)
        expect(document).toEqual({
          name: expect.stringMatching(/.*\/doc-id-123/),
          fields: {
            foo: { stringValue: doc.foo },
            bar: { integerValue: '1' },
            __lastUpdate: { timestampValue: expect.any(String) },
          },
          createTime: expect.any(String),
          updateTime: expect.any(String),
        })
        // eslint-disable-next-line no-underscore-dangle
        const lastUpdate = new Date(document.fields.__lastUpdate.timestampValue)
        expect(lastUpdate, 'lastUpdate').toBeBetween(begin, end)
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
        await db.writeDoc(path, doc)
        const update = {
          ...doc,
          bar: 2,
        }

        // act
        const begin = new Date()
        await db.writeDoc(path, update)
        const end = new Date()

        // assert
        const document = await testHelper.getDocument(pathString)
        expect(document).toEqual({
          name: expect.stringMatching(/.*\/doc-id-345/),
          fields: {
            foo: { stringValue: doc.foo },
            bar: { integerValue: '2' },
            __lastUpdate: { timestampValue: expect.any(String) },
          },
          createTime: expect.any(String),
          updateTime: expect.any(String),
        })
        // eslint-disable-next-line no-underscore-dangle
        const lastUpdate = new Date(document.fields.__lastUpdate.timestampValue)
        expect(lastUpdate, 'lastUpdate').toBeBetween(begin, end)
      })
    })

    describe('.writeDoc and .readDoc', () => {
      it.each`
        pathString
        ${'Col-ReadWrite'}
        ${'Col-ReadWrite/d1/Col-Sub1'}
        ${'Col-ReadWrite/d1/Col-Sub1/d2/Col-Sub2'}
      `('should emit only updated documents with time argument', async ({ pathString }) => {
        // arrange
        const path = pathString.split('/')
        const doc1 = { foo: ulid(), bar: 1 }
        const doc1update = { foo: ulid(), bar: 1 }
        const doc2 = { foo: ulid(), bar: 2 }
        const doc3 = { foo: ulid(), bar: 3 }

        // act
        await db.writeDoc([...path, 'foo'], doc1)
        await db.writeDoc([...path, 'bar'], doc2)
        const results1 = await collectFrom(db.readDocs(path))
        const totalLastUpdate = results1[1].lastUpdate

        await db.writeDoc([...path, 'foo'], doc1update)
        await db.writeDoc([...path, 'baz'], doc3)
        const results2 = await collectFrom(db.readDocs(path, totalLastUpdate))

        // assert
        expect(results1, 'before timestamp').toEqual([
          {
            lastUpdate: expect.any(Number),
            doc: { foo: doc1.foo, bar: doc1.bar },
          },
          {
            lastUpdate: expect.any(Number),
            doc: { foo: doc2.foo, bar: doc2.bar },
          },
        ])
        expect(results2, 'after timestamp').toEqual([
          {
            lastUpdate: expect.any(Number),
            doc: { foo: doc1update.foo, bar: doc1update.bar },
          },
          {
            lastUpdate: expect.any(Number),
            doc: { foo: doc3.foo, bar: doc3.bar },
          },
        ])
      })
    })

    describe('.delDoc', () => {
      it.each`
        pathString
        ${'Col-Delete/doc-id-123'}
        ${'Col-Delete/d1/Col-Sub1/doc-id-123'}
        ${'Col-Delete/d1/Col-Sub1/d2/Col-Sub2/doc-id-123'}
      `('should delete a document $pathString', async ({ pathString }) => {
        // arrange
        const path = pathString.split('/')
        const doc = {
          foo: ulid(),
          bar: 1,
        }
        await db.writeDoc(path, doc)

        // act
        await db.delDoc(path)

        // assert
        const documents = await testHelper.listDocuments(path.slice(0, -1).join('/'))
        expect(documents).toEqual({})
      })
    })
  })
})
