import { FirestoreRestError } from './firestore-rest-error'

describe('FirestoreRestError', () => {
  it('should set the name to class name', () => {
    // arrange
    const message = 'foo'

    // act
    const error = new FirestoreRestError(message)

    // assert
    expect(error.name).toEqual(FirestoreRestError.name)
  })

  it('should set the message', () => {
    // arrange
    const message = 'foo'

    // act
    const error = new FirestoreRestError(message)

    // assert
    expect(error.message).toEqual(message)
  })
})
