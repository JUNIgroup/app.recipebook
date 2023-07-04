import { FirestoreNetworkError } from './firestore-network-error'

describe('FirestoreNetworkError', () => {
  it('should set the name class name', () => {
    // arrange
    const message = 'foo'

    // act
    const error = new FirestoreNetworkError(message, false)

    // assert
    expect(error.name).toEqual(FirestoreNetworkError.name)
  })

  it('should set the message', () => {
    // arrange
    const message = 'foo'

    // act
    const error = new FirestoreNetworkError(message, false)

    // assert
    expect(error.message).toEqual(message)
  })

  it.each`
    aborted
    ${true}
    ${false}
  `('should set the aborted $aborted', ({ aborted }) => {
    // arrange
    const message = 'foo'

    // act
    const error = new FirestoreNetworkError(message, aborted)

    // assert
    expect(error.aborted).toEqual(aborted)
  })
})
