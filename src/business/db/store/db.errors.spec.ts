import { DBError, AbortError, OutdatedError } from './db.errors'
import { OutdatedCause } from './db.types'

describe(DBError.name, () => {
  it('should create an instance', () => {
    expect(new DBError('message')).toBeTruthy()
  })

  it('should have the given message', () => {
    expect(new DBError('foo-bar').message).toEqual('foo-bar')
  })

  it('should have the correct name', () => {
    expect(new DBError('message').name).toEqual('DBError')
  })
})

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

describe(OutdatedError.name, () => {
  it('should create an instance', () => {
    expect(new OutdatedError({})).toBeTruthy()
  })

  it('should have the given message', () => {
    expect(new OutdatedError({}, 'foo-bar').message).toEqual('foo-bar')
  })

  it('should have the default message with 0 objects', () => {
    expect(new OutdatedError({}).message).toEqual('0 objects are outdated')
  })

  it('should have the default message with 1 object', () => {
    const outdatedObjects = { foo: OutdatedCause.LOCAL_NOT_FOUND }
    expect(new OutdatedError(outdatedObjects).message).toEqual('1 object is outdated')
  })

  it('should have the default message with 2 objects', () => {
    const outdatedObjects = { foo: OutdatedCause.LOCAL_NOT_FOUND, bar: OutdatedCause.REMOTE_NOT_FOUND }
    expect(new OutdatedError(outdatedObjects).message).toEqual('2 objects are outdated')
  })

  it('should have the correct name', () => {
    expect(new OutdatedError({}).name).toEqual('OutdatedError')
  })
})
