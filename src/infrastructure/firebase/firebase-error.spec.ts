import { FirebaseError } from './firebase-error'

describe('FirebaseError', () => {
  it('should create an error with an error code', () => {
    const error = new FirebaseError('EMAIL_EXISTS')
    expect(error.errorCode).toBe('EMAIL_EXISTS')
  })

  it('should create an error with error code as message', () => {
    const error = new FirebaseError('EMAIL_EXISTS')
    expect(error.message).toBe('EMAIL_EXISTS')
  })
})
