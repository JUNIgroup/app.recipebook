import {
  RulesTestContext,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { coverageReport, getRulesTestConfig } from './rules.test-helper'

const rulesTestConfig = await getRulesTestConfig({
  rulesFile: 'firestore.rules',
  projectId: import.meta.env.VITE_FIREBASE__PROJECT_ID,
  databaseId: '(default)',
})

describe.runIf(rulesTestConfig.available)('firestore rules', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment(rulesTestConfig)
  })

  afterAll(async () => {
    await testEnv.cleanup()
    await coverageReport(rulesTestConfig, 'general')
  })

  describe('public user profiles', () => {
    let unauthorizedContext: RulesTestContext
    let unauthorizedFirestore: ReturnType<RulesTestContext['firestore']>

    const aliceUserId = 'alice'
    let aliceContext: RulesTestContext
    let aliceFirestore: ReturnType<RulesTestContext['firestore']>

    beforeEach(() => {
      unauthorizedContext = testEnv.unauthenticatedContext()
      unauthorizedFirestore = unauthorizedContext.firestore()

      aliceContext = testEnv.authenticatedContext(aliceUserId, {})
      aliceFirestore = aliceContext.firestore()
    })

    it('should let anyone read any profile', async () => {
      // arrange
      await testEnv.withSecurityRulesDisabled(async (securityContext) => {
        await setDoc(doc(securityContext.firestore(), 'users/foobar'), { foo: 'bar' })
      })

      // act
      const result = getDoc(doc(unauthorizedFirestore, 'users/foobar'))

      // assert
      await assertSucceeds(result)
    })

    it('should not allow users to read from a random collection', async () => {
      // act
      const result = getDoc(doc(unauthorizedFirestore, 'random/foobar'))

      // assert
      await assertFails(result)
    })

    it('should allow signed in user to create their own profile', async () => {
      // before
      await testEnv.withSecurityRulesDisabled(async (securityContext) => {
        await deleteDoc(doc(securityContext.firestore(), `users/${aliceUserId}`))
      })

      // act
      const result = setDoc(doc(aliceFirestore, `users/${aliceUserId}`), {
        birthday: 'January 1',
        createdAt: serverTimestamp(),
      })

      // assert
      await assertSucceeds(result)
    })

    it('should not allow signed in user to create their own profile without required `createdAt` field', async () => {
      // before
      await testEnv.withSecurityRulesDisabled(async (securityContext) => {
        await deleteDoc(doc(securityContext.firestore(), `users/${aliceUserId}`))
      })

      // act
      const result = setDoc(doc(aliceFirestore, `users/${aliceUserId}`), {
        birthday: 'January 1',
      })

      // assert
      await assertFails(result)
    })

    it(`should not allow signed in user to create someone else's profile`, async () => {
      // act
      const result = setDoc(doc(aliceFirestore, `users/bob`), {
        birthday: 'January 1',
        createdAt: serverTimestamp(),
      })

      // assert
      await assertFails(result)
    })
  })
})
