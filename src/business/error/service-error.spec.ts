/* eslint-disable max-classes-per-file */

import { ServiceError, toServiceErrorDto, ServiceErrorDto } from './service-error'

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

describe('toServiceErrorDto', () => {
  it('should reject cause and stack', () => {
    const error = new ServiceError('foo-service', 'bar-message', { cause: 'test with cause' })
    const errorDto: ServiceErrorDto = toServiceErrorDto(error)
    expect(errorDto).toEqual({
      service: 'foo-service',
      plainMessage: 'bar-message',
    })
  })

  it('should pass additional string, boolean and number fields', () => {
    class DerivedError extends ServiceError {
      constructor(
        service: string,
        plainMessage: string,
        public aString: string,
        public aBoolean: boolean,
        public aNumber: number,
      ) {
        super(service, plainMessage)
      }
    }
    const error = new DerivedError('foo-service', 'bar-message', 'baz', true, 42)

    const errorDto: ServiceErrorDto = toServiceErrorDto(error)
    expect(errorDto).toEqual({
      service: 'foo-service',
      plainMessage: 'bar-message',
      aString: 'baz',
      aBoolean: true,
      aNumber: 42,
    })
  })

  it('should filter additional non-string, non-boolean, non-number fields', () => {
    class DerivedError extends ServiceError {
      constructor(
        service: string,
        plainMessage: string,
        public anObject: object,
        public aUndefined: undefined,
        public aNull: null,
      ) {
        super(service, plainMessage)
      }
    }
    const error = new DerivedError('foo-service', 'bar-message', {}, undefined, null)
    const errorDto: ServiceErrorDto = toServiceErrorDto(error)
    expect(errorDto).toEqual({
      service: 'foo-service',
      plainMessage: 'bar-message',
    })
  })
})
