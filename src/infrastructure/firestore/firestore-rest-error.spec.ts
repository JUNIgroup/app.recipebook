import { FirestoreRestError } from './firestore-rest-error'

describe('FirestoreError', () => {
  it('should set the name to FirestoreError', () => {
    // arrange
    const message = 'foo'

    // act
    const error = new FirestoreRestError(message)

    // assert
    expect(error.name).toEqual('FirestoreError')
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
