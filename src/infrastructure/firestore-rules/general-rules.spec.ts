import {
  RulesTestContext,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { ulid } from 'ulid'
import { coverageReport, deleteAllDocs, getRulesTestConfig } from './rules.test-helper'

const rulesTestConfig = await getRulesTestConfig({
  rulesFile: 'firestore.rules',
  projectId: import.meta.env.VITE_FIREBASE__PROJECT_ID,
  databaseId: '(default)',
})

// see https://firebase.google.com/docs/reference/rules/rules
// see https://makerkit.dev/blog/tutorials/in-depth-guide-firestore-security-rules

describe.runIf(rulesTestConfig.available)('firestore rules', () => {
  let testEnv: RulesTestEnvironment

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let unauthorizedContext: RulesTestContext

  const aliceUserId = 'alice'
  let aliceContext: RulesTestContext

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment(rulesTestConfig)
  })

  afterAll(async () => {
    await testEnv.cleanup()
    await coverageReport(rulesTestConfig, 'general')
  })

  beforeEach(() => {
    unauthorizedContext = testEnv.unauthenticatedContext()

    aliceContext = testEnv.authenticatedContext(aliceUserId, {})
  })

  describe('bucket', () => {
    const bucketCollectionName = 'RulesFlatBuckets'

    type LightDoc = {
      rev: unknown
      __lastUpdate: unknown
      __deleted?: true
      content: unknown
    }

    beforeAll(async () => {
      await testEnv.withSecurityRulesDisabled(async (securityContext) => {
        await deleteAllDocs(securityContext.firestore(), bucketCollectionName)
      })
    })

    describe('create', () => {
      it('should let create bucket document with rev 0 and last update as server time', async () => {
        // arrange
        const id = ulid()
        const document: LightDoc = {
          rev: 0,
          __lastUpdate: serverTimestamp(),
          content: 123,
        }

        // act
        const result = setDoc(doc(aliceContext.firestore(), bucketCollectionName, id), document)

        // assert
        await assertSucceeds(result)
      })

      it('should not let create bucket document because __deleted is set', async () => {
        // arrange
        const id = ulid()
        const document: LightDoc = {
          rev: 0,
          __lastUpdate: serverTimestamp(),
          content: 123,
          __deleted: true,
        }

        // act
        const result = setDoc(doc(aliceContext.firestore(), bucketCollectionName, id), document)

        // assert
        await assertFails(result)
      })

      it.each`
        rev          | lastUpdate           | cause
        ${undefined} | ${serverTimestamp()} | ${'rev is not defined'}
        ${1}         | ${serverTimestamp()} | ${'rev != 0'}
        ${'zero'}    | ${serverTimestamp()} | ${'rev is not a number'}
        ${0}         | ${undefined}         | ${'last update is not defined'}
        ${0}         | ${12345}             | ${'last update is not a server timestamp'}
      `('should not let create bucket document because $cause', async ({ rev, lastUpdate }) => {
        // arrange
        const id = ulid()
        const document: LightDoc = removeUndefinedValues({
          rev,
          __lastUpdate: lastUpdate,
          content: 123,
        })

        // act
        const result = setDoc(doc(aliceContext.firestore(), bucketCollectionName, id), document)

        // assert
        await assertFails(result)
      })
    })

    describe('update', () => {
      const storedRev = 42
      let documentId: string
      let storedDocument: LightDoc

      beforeEach(async () => {
        documentId = ulid()
        storedDocument = {
          rev: storedRev,
          __lastUpdate: 12345,
          content: 123,
        }

        await testEnv.withSecurityRulesDisabled(async (securityContext) => {
          await setDoc(doc(securityContext.firestore(), bucketCollectionName, documentId), storedDocument)
        })
      })

      it('should let update bucket document with rev increased and last update', async () => {
        // arrange
        const document = {
          rev: storedRev + 1,
          __lastUpdate: serverTimestamp(),
          content: 'foo',
        }

        // act
        const result = setDoc(doc(aliceContext.firestore(), bucketCollectionName, documentId), document)

        // assert
        await assertSucceeds(result)
      })

      it('should let update bucket document with rev increased and last update and deleted', async () => {
        // arrange
        const document = {
          rev: storedRev + 1,
          __lastUpdate: serverTimestamp(),
          content: 'foo',
          __deleted: true,
        }

        // act
        const result = setDoc(doc(aliceContext.firestore(), bucketCollectionName, documentId), document)

        // assert
        await assertSucceeds(result)
      })

      it.each`
        rev              | lastUpdate           | cause
        ${undefined}     | ${serverTimestamp()} | ${'rev is not defined'}
        ${0}             | ${serverTimestamp()} | ${'rev is 0'}
        ${storedRev}     | ${serverTimestamp()} | ${'rev not increased'}
        ${storedRev + 2} | ${serverTimestamp()} | ${'rev increased to much'}
        ${'zero'}        | ${serverTimestamp()} | ${'rev is not a number'}
        ${storedRev + 1} | ${undefined}         | ${'last update is not defined'}
        ${storedRev + 1} | ${12345}             | ${'last update is not a server timestamp'}
      `('should not let update bucket document because $cause', async ({ rev, lastUpdate }) => {
        // arrange
        const document = removeUndefinedValues({
          rev,
          __lastUpdate: lastUpdate,
          content: 123,
        })

        // act
        const result = setDoc(doc(aliceContext.firestore(), bucketCollectionName, documentId), document)

        // assert
        await assertFails(result)
      })
    })
  })

  describe('collection', () => {
    const bucketCollectionName = 'RulesDeepBuckets'
    const bucketPath = `${bucketCollectionName}/${ulid()}}`
    const bucketDocument: LightDoc = {
      rev: 25,
      __lastUpdate: serverTimestamp(),
      content: 123,
    }
    const collectionPath = `${bucketPath}/Collection`

    type LightDoc = {
      rev: unknown
      __lastUpdate: unknown
      __deleted?: true
      content: unknown
    }

    beforeAll(async () => {
      await testEnv.withSecurityRulesDisabled(async (securityContext) => {
        const firestore = securityContext.firestore()
        await deleteAllDocs(firestore, collectionPath)
        await deleteAllDocs(firestore, bucketCollectionName)
        await setDoc(doc(firestore, bucketPath), bucketDocument)
      })
    })

    describe('create', () => {
      it('should let create collection document with rev 0 and last update as server time', async () => {
        // arrange
        const id = ulid()
        const document: LightDoc = {
          rev: 0,
          __lastUpdate: serverTimestamp(),
          content: 123,
        }

        // act
        const result = setDoc(doc(aliceContext.firestore(), collectionPath, id), document)

        // assert
        await assertSucceeds(result)
      })

      it('should not let create collection document because __deleted is set', async () => {
        // arrange
        const id = ulid()
        const document: LightDoc = {
          rev: 0,
          __lastUpdate: serverTimestamp(),
          content: 123,
          __deleted: true,
        }

        // act
        const result = setDoc(doc(aliceContext.firestore(), collectionPath, id), document)

        // assert
        await assertFails(result)
      })

      it('should not let create collection document because bucket document does not exist', async () => {
        // arrange
        const id = ulid()
        const otherCollectionPath = `${bucketCollectionName}/other/Collection`
        const document: LightDoc = {
          rev: 0,
          __lastUpdate: serverTimestamp(),
          content: 123,
          __deleted: true,
        }

        // act
        const result = setDoc(doc(aliceContext.firestore(), otherCollectionPath, id), document)

        // assert
        await assertFails(result)
      })

      it.each`
        rev          | lastUpdate           | cause
        ${undefined} | ${serverTimestamp()} | ${'rev is not defined'}
        ${1}         | ${serverTimestamp()} | ${'rev != 0'}
        ${'zero'}    | ${serverTimestamp()} | ${'rev is not a number'}
        ${0}         | ${undefined}         | ${'last update is not defined'}
        ${0}         | ${12345}             | ${'last update is not a server timestamp'}
      `('should not let create collection document because $cause', async ({ rev, lastUpdate }) => {
        // arrange
        const id = ulid()
        const document: LightDoc = removeUndefinedValues({
          rev,
          __lastUpdate: lastUpdate,
          content: 123,
        })

        // act
        const result = setDoc(doc(aliceContext.firestore(), collectionPath, id), document)

        // assert
        await assertFails(result)
      })
    })

    describe('update', () => {
      const storedRev = 42
      let documentId: string
      let storedDocument: LightDoc

      beforeEach(async () => {
        documentId = ulid()
        storedDocument = {
          rev: storedRev,
          __lastUpdate: 12345,
          content: 123,
        }

        await testEnv.withSecurityRulesDisabled(async (securityContext) => {
          await setDoc(doc(securityContext.firestore(), collectionPath, documentId), storedDocument)
        })
      })

      it('should let update collection document with rev increased and last update', async () => {
        // arrange
        const document = {
          rev: storedRev + 1,
          __lastUpdate: serverTimestamp(),
          content: 'foo',
        }

        // act
        const result = setDoc(doc(aliceContext.firestore(), collectionPath, documentId), document)

        // assert
        await assertSucceeds(result)
      })

      it('should let update collection document with rev increased and last update and deleted', async () => {
        // arrange
        const document = {
          rev: storedRev + 1,
          __lastUpdate: serverTimestamp(),
          content: 'foo',
          __deleted: true,
        }

        // act
        const result = setDoc(doc(aliceContext.firestore(), collectionPath, documentId), document)

        // assert
        await assertSucceeds(result)
      })

      it.each`
        rev              | lastUpdate           | cause
        ${undefined}     | ${serverTimestamp()} | ${'rev is not defined'}
        ${0}             | ${serverTimestamp()} | ${'rev is 0'}
        ${storedRev}     | ${serverTimestamp()} | ${'rev not increased'}
        ${storedRev + 2} | ${serverTimestamp()} | ${'rev increased to much'}
        ${'zero'}        | ${serverTimestamp()} | ${'rev is not a number'}
        ${storedRev + 1} | ${undefined}         | ${'last update is not defined'}
        ${storedRev + 1} | ${12345}             | ${'last update is not a server timestamp'}
      `('should not let collection document because $cause', async ({ rev, lastUpdate }) => {
        // arrange
        const document = removeUndefinedValues({
          rev,
          __lastUpdate: lastUpdate,
          content: 123,
        })

        // act
        const result = setDoc(doc(aliceContext.firestore(), collectionPath, documentId), document)

        // assert
        await assertFails(result)
      })
    })
  })
})

function removeUndefinedValues<T>(obj: T): T {
  if (typeof obj !== 'object' || obj == null) return obj
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, removeUndefinedValues(v)]),
  ) as T
}
