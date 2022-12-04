import { ServiceError } from './service-error'

describe('ServiceError', () => {
  it('should store service', () => {
    const error = new ServiceError('FooService', 'bar baz')
    expect(error.service).toBe('FooService')
  })

  it('should store plain message', () => {
    const error = new ServiceError('FooService', 'bar baz')
    expect(error.plainMessage).toBe('bar baz')
  })

  it('should provide combined message', () => {
    const error = new ServiceError('FooService', 'bar baz')
    expect(error.message).toBe('[FooService] bar baz')
  })

  it('should provide combined message', () => {
    const error = new ServiceError('FooService', 'bar baz')
    expect(error.message).toBe('[FooService] bar baz')
  })

  it('should provide optional cause', () => {
    const cause = new Error('BAZ')
    const error = new ServiceError('FooService', 'bar baz', { cause })
    expect(error.cause).toBe(cause)
  })
})
