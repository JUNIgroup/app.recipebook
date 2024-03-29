import { ulid } from 'ulid'
import { isEmulatorAvailable } from '../../utilities/firebase/emulator-utils'
import { FirestoreTestHelper } from '../../utilities/firebase/firestore.test-helper'
import { convertToPlainValue } from './convert-from'
import { convertObjectToFields, convertToTypedValue } from './convert-to'

const emulatorAvailable = await isEmulatorAvailable()
const firestoreEmulator = emulatorAvailable?.firestore

describe('convert between plain and firebase data', () => {
  const valueAndTypeTuples = [
    true,
    false,
    null,
    42,
    9223372036854775000, // max supported integer
    -9223372036854775000, // max supported integer
    2 ** 63,
    -(2 ** 63),
    3.14,
    '',
    'foo',
    [],
    ['bar', 42],
    {},
    { foo: 'bar', baz: 42 },
    //
  ].map((value) => [value, typeof value])

  it.each(valueAndTypeTuples)('should convert %s (%s) directly', (value) => {
    // act
    const typedValue = convertToTypedValue(value)
    const plainValue = convertToPlainValue(typedValue)

    // assert
    expect(plainValue).toEqual(value)
  })

  describe.runIf(firestoreEmulator)('over firestore: convert, put, get and convert back', () => {
    const { host: firestoreHost = '', port: firestorePort = 0 } = firestoreEmulator ?? {}

    const projectId = import.meta.env.VITE_FIREBASE__PROJECT_ID
    const databaseId = '(default)'
    const collectionId = 'convert-spec'
    const testHelper = new FirestoreTestHelper(firestoreHost, firestorePort, projectId, databaseId)

    beforeAll(async () => {
      await testHelper.deleteEmulatorCollection(collectionId)
    })

    it.each(valueAndTypeTuples)('should handle %s (%s)', async (value) => {
      // arrange
      const object = { value }
      const docId = ulid() + typeof value

      // act
      const document1 = { fields: convertObjectToFields(object) }
      await testHelper.patchDocument(`${collectionId}/${docId}`, document1)
      const document2 = await testHelper.getDocument(`${collectionId}/${docId}`)
      const result = convertToPlainValue(document2.fields.value)

      // assert
      expect(document2).toEqual({
        name: expect.any(String),
        ...document1,
        createTime: expect.any(String),
        updateTime: expect.any(String),
      })
      expect(result).toEqual(value)
    })
  })
})
