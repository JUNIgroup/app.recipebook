import { dataFilter, UNLOADED } from './redux-helper'

describe('UNLOADED', () => {
  it('should be undefined', () => {
    expect(UNLOADED).toBeUndefined()
  })
})

describe('dataFilter', () => {
  it('should allow to filter empty array', () => {
    const array: unknown[] = []
    const result = array.filter(dataFilter)
    expect(result).toEqual([])
  })

  it('should allow to filter undefined and null but not empty strings, objects or booleans', () => {
    type Data = string | boolean | object | unknown[]
    const array: (Data | undefined | null)[] = ['a', '', undefined, false, true, null, {}, [], 'b']
    const result: Data[] = array.filter(dataFilter)
    expect(result).toEqual(['a', '', false, true, {}, [], 'b'])
  })
})
