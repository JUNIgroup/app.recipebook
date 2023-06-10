import { FirestoreError } from './firestore-error'

describe('FirestoreError', () => {
  it('should set the name to FirestoreError', () => {
    // arrange
    const message = 'foo'

    // act
    const error = new FirestoreError(message)

    // assert
    expect(error.name).toEqual('FirestoreError')
  })

  it('should set the message', () => {
    // arrange
    const message = 'foo'

    // act
    const error = new FirestoreError(message)

    // assert
    expect(error.message).toEqual(message)
  })
})
