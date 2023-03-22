import { parseDoc } from './doc'
import { createTimestamp } from './timestamp'

describe('parseDoc', () => {
  it('should return a Doc', () => {
    // arrange
    const doc = {
      name: 'projects/«project»/databases/(default)/documents/«collection»/«id»',
      createTime: '2020-01-01T00:00:00.123456789Z',
      updateTime: '2021-12-31T23:59:59.987654321Z',
      fields: {
        foo: {
          stringValue: 'bar',
        },
      },
    }

    // act
    const result = parseDoc(doc)

    // assert
    expect(result).toEqual({
      id: '«id»',
      name: 'projects/«project»/databases/(default)/documents/«collection»/«id»',
      createTime: createTimestamp(1577836800123, 456789),
      updateTime: createTimestamp(1640995199987, 654321),
      data: {
        foo: 'bar',
      },
    })
  })

  it('should throw error for a non document', () => {
    // arrange
    const doc = 42

    // act
    const act = () => parseDoc(doc)

    // assert
    expect(act).toThrowError('Expected a record for document but received 42')
  })

  it('should throw error for a document name does not have an ID', () => {
    // arrange
    const doc = {
      name: 'not-a-path',
      createTime: '2020-01-01T00:00:00.123456789Z',
      updateTime: '2021-12-31T23:59:59.987654321Z',
      fields: {},
    }

    // act
    const act = () => parseDoc(doc)

    // assert
    expect(act).toThrowError('Expected a document name with /«id» at the end but received not-a-path')
  })
})
