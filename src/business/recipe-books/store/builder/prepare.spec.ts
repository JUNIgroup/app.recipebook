import { checkNotDeleted, checkRevisionZero, increaseRevision, markDeleted } from './prepare'

describe('checkRevisionZero', () => {
  it('should create a function', () => {
    // arrange
    const prepare = vi.fn()

    // act
    const extendedPrepare = checkRevisionZero(prepare)

    // assert
    expect(extendedPrepare).toBeInstanceOf(Function)
  })

  it('should call prepare with given payload', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0 } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = checkRevisionZero(prepare)
    extendedPrepare(payload)

    // assert
    expect(prepare).toHaveBeenCalledWith(payload)
  })

  it('should throw if revision is not 0', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 1 } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = checkRevisionZero(prepare)
    const act = () => extendedPrepare(payload)

    // assert
    expect(act).toThrowError('Expect revision to be 0 for new document.')
  })

  it('should return the result of prepare if revision is 0', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0 } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = checkRevisionZero(prepare)
    const extendedPayload = extendedPrepare(payload)

    // assert
    expect(extendedPayload).toBe(preparedPayload)
  })
})

describe('checkNotDeleted', () => {
  it('should create a function', () => {
    // arrange
    const prepare = vi.fn()

    // act
    const extendedPrepare = checkNotDeleted(prepare)

    // assert
    expect(extendedPrepare).toBeInstanceOf(Function)
  })

  it('should call prepare with given payload', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0 } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = checkNotDeleted(prepare)
    extendedPrepare(payload)

    // assert
    expect(prepare).toHaveBeenCalledWith(payload)
  })

  it('should throw if document is deleted', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0, __deleted: true } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = checkNotDeleted(prepare)
    const act = () => extendedPrepare(payload)

    // assert
    expect(act).toThrowError('Expect document to not be deleted.')
  })

  it('should return the result of prepare if document is not deleted (no property)', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0 } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = checkNotDeleted(prepare)
    const extendedPayload = extendedPrepare(payload)

    // assert
    expect(extendedPayload).toBe(preparedPayload)
  })

  it('should return the result of prepare if document is not deleted (false)', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0, __deleted: false } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = checkNotDeleted(prepare)
    const extendedPayload = extendedPrepare(payload)

    // assert
    expect(extendedPayload).toBe(preparedPayload)
  })
})

describe('increaseRevision', () => {
  it('should create a function', () => {
    // arrange
    const prepare = vi.fn()

    // act
    const extendedPrepare = increaseRevision(prepare)

    // assert
    expect(extendedPrepare).toBeInstanceOf(Function)
  })

  it('should call prepare with given payload', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0 } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = increaseRevision(prepare)
    extendedPrepare(payload)

    // assert
    expect(prepare).toHaveBeenCalledWith(payload)
  })

  it('should increase revision by 1', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0 } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = increaseRevision(prepare)
    const extendedPayload = extendedPrepare(payload)

    // assert
    expect(extendedPayload.document.rev).toBe(1)
  })

  it('should return the result of prepare with increased revision', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0 } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = increaseRevision(prepare)
    const extendedPayload = extendedPrepare(payload)

    // assert
    expect(extendedPayload).toEqual({
      document: {
        id: 'foo',
        rev: 1,
      },
    })
  })

  it('should not modify the preparedPayload and document of preparedPayload', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0, more: { bar: 42 } } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = increaseRevision(prepare)
    const extendedPayload = extendedPrepare(payload)

    // assert
    expect(extendedPayload).not.toBe(preparedPayload)
    expect(extendedPayload.document).not.toBe(preparedPayload.document)
    expect(extendedPayload.document.more).toBe(preparedPayload.document.more)
  })
})

describe('markDeleted', () => {
  it('should create a function', () => {
    // arrange
    const prepare = vi.fn()

    // act
    const extendedPrepare = markDeleted(prepare)

    // assert
    expect(extendedPrepare).toBeInstanceOf(Function)
  })

  it('should call prepare with given payload', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0 } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = markDeleted(prepare)
    extendedPrepare(payload)

    // assert
    expect(prepare).toHaveBeenCalledWith(payload)
  })

  it('should set __deleted to true', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0 } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = markDeleted(prepare)
    const extendedPayload = extendedPrepare(payload)

    // assert
    // eslint-disable-next-line no-underscore-dangle
    expect(extendedPayload.document.__deleted).toBe(true)
  })

  it('should return the result of prepare with __deleted set to true', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0 } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = markDeleted(prepare)
    const extendedPayload = extendedPrepare(payload)

    // assert
    expect(extendedPayload).toEqual({
      document: {
        id: 'foo',
        rev: 0,
        __deleted: true,
      },
    })
  })

  it('should remove all additional properties from document', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0, more: { bar: 42 } } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = markDeleted(prepare)
    const extendedPayload = extendedPrepare(payload)

    // assert
    expect(extendedPayload).toEqual({
      document: {
        id: 'foo',
        rev: 0,
        __deleted: true,
      },
    })
  })

  it('should not modify the preparedPayload and document of preparedPayload', () => {
    // arrange
    const payload = { something: 'bar' }
    const preparedPayload = { document: { id: 'foo', rev: 0, more: { bar: 42 } } }
    const prepare = vi.fn().mockReturnValue(preparedPayload)

    // act
    const extendedPrepare = markDeleted(prepare)
    const extendedPayload = extendedPrepare(payload)

    // assert
    expect(extendedPayload).not.toBe(preparedPayload)
    expect(extendedPayload.document).not.toBe(preparedPayload.document)
  })
})

describe('compose typical prepare functions', () => {
  type MyPayload = { id: string; rev: number; name: string }
  const prepare = (myPayload: MyPayload) => ({ document: myPayload })

  describe('for add', () => {
    const addPrepare = checkRevisionZero(checkNotDeleted(prepare))

    it('should throw if revision is not 0', () => {
      // arrange
      const payload = { id: 'foo', rev: 1, name: 'bar' }

      // act
      const act = () => addPrepare(payload)

      // assert
      expect(act).toThrowError('Expect revision to be 0 for new document.')
    })

    it('should throw if document is deleted', () => {
      // arrange
      const payload = { id: 'foo', rev: 0, name: 'bar', __deleted: true }

      // act
      const act = () => addPrepare(payload)

      // assert
      expect(act).toThrowError('Expect document to not be deleted.')
    })

    it('should return the result of prepare if revision is 0 and document is not deleted', () => {
      // arrange
      const payload = { id: 'foo', rev: 0, name: 'bar' }

      // act
      const extendedPayload = addPrepare(payload)

      // assert
      expect(extendedPayload).toEqual({
        document: {
          id: 'foo',
          rev: 0,
          name: 'bar',
        },
      })
    })
  })

  describe('for update', () => {
    const updatePrepare = increaseRevision(checkNotDeleted(prepare))

    it('should throw if document is deleted', () => {
      // arrange
      const payload = { id: 'foo', rev: 0, name: 'bar', __deleted: true }

      // act
      const act = () => updatePrepare(payload)

      // assert
      expect(act).toThrowError('Expect document to not be deleted.')
    })

    it('should return the result of prepare with increased revision if document is not deleted', () => {
      // arrange
      const payload = { id: 'foo', rev: 2, name: 'bar' }

      // act
      const extendedPayload = updatePrepare(payload)

      // assert
      expect(extendedPayload).toEqual({
        document: {
          id: 'foo',
          rev: 3,
          name: 'bar',
        },
      })
    })
  })

  describe('for delete', () => {
    const deletePrepare = increaseRevision(markDeleted(prepare))

    it('should return the result of prepare with increased revision and __deleted set to true and removed all additional properties', () => {
      // arrange
      const payload = { id: 'foo', rev: 2, name: 'bar' }

      // act
      const extendedPayload = deletePrepare(payload)

      // assert
      expect(extendedPayload).toEqual({
        document: {
          id: 'foo',
          rev: 3,
          __deleted: true,
        },
      })
    })
  })
})
