import { AbortError } from './abort-error'

describe(AbortError.name, () => {
  it('should create an instance', () => {
    expect(new AbortError('message')).toBeTruthy()
  })

  it('should have the given message', () => {
    expect(new AbortError('foo-bar').message).toEqual('foo-bar')
  })

  it('should have the default message', () => {
    expect(new AbortError().message).toEqual('Transaction aborted')
  })

  it('should have the correct name', () => {
    expect(new AbortError('message').name).toEqual('AbortError')
  })
})
