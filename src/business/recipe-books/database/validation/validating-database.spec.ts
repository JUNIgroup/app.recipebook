import { of } from 'rxjs'
import { collectFrom } from '../../../../infrastructure/database/helpers/collect-from'
import { FakeLogger, createFakeLogger } from '../../../../utilities/logger/fake-logger.test-helper'
import { Database, Result } from '../database'
import { Doc, EpochTimestamp } from '../database-types'
import { DocSchema } from './schema'
import { ValidatingDatabase, createRecommendedValidators } from './validating-database'
import { Validator } from './validator'

describe('createRecommendedValidators', () => {
  const databaseSchemas = {
    foo: {
      bucket: DocSchema,
      collections: {
        bar: DocSchema,
      },
    },
  }

  function namesOf(validators: Validator[] = []): string[] {
    return validators.map((validator) => validator.name)
  }

  let oldNodeEnv: string | undefined

  beforeEach(() => {
    oldNodeEnv = process.env.NODE_ENV
  })

  afterEach(() => {
    process.env.NODE_ENV = oldNodeEnv
  })

  describe('in production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    it(`should return 'get' validators for production`, () => {
      // act
      const validators = createRecommendedValidators(databaseSchemas)

      // assert
      expect(namesOf(validators.get), 'get').toEqual(['validateDatabaseSchema'])
    })

    it(`should return 'put' validators for production`, () => {
      // act
      const validators = createRecommendedValidators(databaseSchemas)

      // assert
      expect(namesOf(validators.put), 'put').toEqual([])
    })
  })

  describe('in development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it(`should return 'get' validators for development`, () => {
      // act
      const validators = createRecommendedValidators(databaseSchemas)

      // assert
      expect(namesOf(validators.get), 'get').toEqual(['validateId', 'validateRevision', 'validateDatabaseSchema'])
    })

    it(`should return 'put' validators for development`, () => {
      // act
      const validators = createRecommendedValidators(databaseSchemas)

      // assert
      expect(namesOf(validators.put), 'put').toEqual(['validateId', 'validateRevision', 'validateDatabaseSchema'])
    })
  })
})

describe('ValidatingDatabase', () => {
  const operationCode = '«test»'

  let logger: FakeLogger
  let innerDatabase: Database

  beforeEach(() => {
    logger = createFakeLogger({ console: true })
    innerDatabase = {
      getDocs: vi.fn(),
      putDoc: vi.fn(),
    }
  })

  it('should initialize', async () => {
    // act
    const db = new ValidatingDatabase(logger, innerDatabase)

    // assert
    expect(db).toBeDefined()
  })

  it(`should create 'business' log with class name`, async () => {
    // arrange
    const mockLogger = vi.fn().mockImplementation(logger)

    // act
    // eslint-disable-next-line no-new
    new ValidatingDatabase(mockLogger, innerDatabase)

    // assert
    expect(mockLogger).toHaveBeenCalledWith(`business:${ValidatingDatabase.name}`)
  })

  describe('getDocs', () => {
    it('should request inner database (no after)', async () => {
      // arrange
      const validators = { get: [] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      vi.spyOn(innerDatabase, 'getDocs').mockReturnValueOnce(of())

      // act
      await collectFrom(db.getDocs(operationCode, path))

      // assert
      expect(innerDatabase.getDocs).toHaveBeenCalledWith(operationCode, path, undefined)
    })

    it('should request inner database (with after)', async () => {
      // arrange
      const validators = { get: [] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      const after: EpochTimestamp = 1234
      vi.spyOn(innerDatabase, 'getDocs').mockReturnValueOnce(of())

      // act
      await collectFrom(db.getDocs(operationCode, path, after))

      // assert
      expect(innerDatabase.getDocs).toHaveBeenCalledWith(operationCode, path, after)
    })

    it('should pass through empty results of the inner database if no validator is defined', async () => {
      // arrange
      const validators = { get: [] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      vi.spyOn(innerDatabase, 'getDocs').mockReturnValueOnce(of([]))

      // act
      const result = await collectFrom(db.getDocs(operationCode, path))

      // assert
      expect(result.flat()).toEqual([])
    })

    it('should pass through empty results of the inner database if all validators pass', async () => {
      // arrange
      const validator1: Validator = () => null
      const validator2: Validator = () => null
      const validators = { get: [validator1, validator2] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      vi.spyOn(innerDatabase, 'getDocs').mockReturnValueOnce(of([]))

      // act
      const result = await collectFrom(db.getDocs(operationCode, path))

      // assert
      expect(result.flat()).toEqual([])
    })

    it('should pass through the result of the inner database if no validator is defined', async () => {
      // arrange
      const validators = { get: [] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      const result1: Result<Doc> = { lastUpdate: 1000, doc: { id: 'foo-1', rev: 0 } }
      const result2: Result<Doc> = { lastUpdate: 1200, doc: { id: 'foo-2', rev: 0 } }
      const result3: Result<Doc> = { lastUpdate: 1400, doc: { id: 'foo-3', rev: 0 } }
      vi.spyOn(innerDatabase, 'getDocs').mockReturnValueOnce(of([result1], [result2, result3]))

      // act
      const result = await collectFrom(db.getDocs(operationCode, path))

      // assert
      expect(result.flat()).toEqual([result1, result2, result3])
    })

    it('should pass through the result of the inner database if all validators pass', async () => {
      // arrange
      const validator1: Validator = () => null
      const validator2: Validator = () => null
      const validators = { get: [validator1, validator2] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      const result1: Result<Doc> = { lastUpdate: 1000, doc: { id: 'foo-1', rev: 0 } }
      const result2: Result<Doc> = { lastUpdate: 1200, doc: { id: 'foo-2', rev: 0 } }
      const result3: Result<Doc> = { lastUpdate: 1400, doc: { id: 'foo-3', rev: 0 } }
      vi.spyOn(innerDatabase, 'getDocs').mockReturnValueOnce(of([result1], [result2, result3]))

      // act
      const result = await collectFrom(db.getDocs(operationCode, path))

      // assert
      expect(result.flat()).toEqual([result1, result2, result3])
    })

    it('should ignore results, which does not pass at least one validator', async () => {
      // arrange
      const validator1: Validator = (_path, doc) => (doc.id === 'foo-1' ? 'invalid 1' : null)
      const validator2: Validator = (_path, doc) => (doc.id === 'foo-2' ? 'invalid 2' : null)
      const validators = { get: [validator1, validator2] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      const result1: Result<Doc> = { lastUpdate: 1000, doc: { id: 'foo-1', rev: 0 } }
      const result2: Result<Doc> = { lastUpdate: 1200, doc: { id: 'foo-2', rev: 0 } }
      const result3: Result<Doc> = { lastUpdate: 1400, doc: { id: 'foo-3', rev: 0 } }
      vi.spyOn(innerDatabase, 'getDocs').mockReturnValueOnce(of([result1], [result2, result3]))

      // act
      const result = await collectFrom(db.getDocs(operationCode, path))

      // assert
      expect(result.flat()).toEqual([result3])
    })

    it('should log ignored results', async () => {
      // arrange
      const validator1: Validator = (_path, doc) => (doc.id === 'foo-1' ? 'invalid 1' : null)
      const validator2: Validator = (_path, doc) => (doc.id === 'foo-2' ? 'invalid 2' : null)
      const validators = { get: [validator1, validator2] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      const result1: Result<Doc> = { lastUpdate: 1000, doc: { id: 'foo-1', rev: 0 } }
      const result2: Result<Doc> = { lastUpdate: 1200, doc: { id: 'foo-2', rev: 0 } }
      const result3: Result<Doc> = { lastUpdate: 1400, doc: { id: 'foo-3', rev: 0 } }
      vi.spyOn(innerDatabase, 'getDocs').mockReturnValueOnce(of([result1], [result2, result3]))

      // act
      await collectFrom(db.getDocs(operationCode, path))

      // assert
      const logMessages = logger('business:ValidatingDatabase').messages
      expect(logMessages).toEqual([
        '«test» [getDocs] Ignore invalid document foo/foo-1: invalid 1',
        '«test»    {"id":"foo-1","rev":0}',
        '«test» [getDocs] Ignore invalid document foo/foo-2: invalid 2',
        '«test»    {"id":"foo-2","rev":0}',
      ])
    })
  })

  describe('putDoc', () => {
    it('should request inner database', async () => {
      // arrange
      const validators = { put: [] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      const doc: Doc = { id: 'foo-1', rev: 0 }
      const result: Result<Doc> = { lastUpdate: 1000, doc }
      vi.spyOn(innerDatabase, 'putDoc').mockResolvedValueOnce(result)

      // act
      await db.putDoc(operationCode, path, doc)

      // assert
      expect(innerDatabase.putDoc).toHaveBeenCalledWith(operationCode, path, doc)
    })

    it('should pass through the result of the inner database if no validator is defined', async () => {
      // arrange
      const validators = { put: [], get: [] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      const doc: Doc = { id: 'foo-1', rev: 0 }
      const result: Result<Doc> = { lastUpdate: 1000, doc }
      vi.spyOn(innerDatabase, 'putDoc').mockResolvedValueOnce(result)

      // act
      const actual = await db.putDoc(operationCode, path, doc)

      // assert
      expect(actual).toEqual(result)
    })

    it('should pass through the result of the inner database if all validators pass', async () => {
      // arrange
      const putValidator1: Validator = () => null
      const putValidator2: Validator = () => null
      const getValidator1: Validator = () => null
      const getValidator2: Validator = () => null
      const validators = { put: [putValidator1, putValidator2], get: [getValidator1, getValidator2] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      const doc: Doc = { id: 'foo-1', rev: 0 }
      const result: Result<Doc> = { lastUpdate: 1000, doc }
      vi.spyOn(innerDatabase, 'putDoc').mockResolvedValueOnce(result)

      // act
      const actual = await db.putDoc(operationCode, path, doc)

      // assert
      expect(actual).toEqual(result)
    })

    it('should not forward the document to the inner database if at least one put validator fails', async () => {
      // arrange
      const putValidator1: Validator = () => null
      const putValidator2: Validator = () => 'invalid'
      const validators = { put: [putValidator1, putValidator2] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      const doc: Doc = { id: 'foo-1', rev: 0 }
      vi.spyOn(innerDatabase, 'putDoc').mockResolvedValueOnce({ lastUpdate: 1000, doc })

      // act
      await db.putDoc(operationCode, path, doc).catch(() => null)

      // assert
      expect(innerDatabase.putDoc).not.toHaveBeenCalled()
    })

    it('should throw an error if at least one put validator fails', async () => {
      // arrange
      const putValidator1: Validator = () => null
      const putValidator2: Validator = () => 'invalid A'
      const validators = { put: [putValidator1, putValidator2] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      const doc: Doc = { id: 'foo-1', rev: 0 }
      vi.spyOn(innerDatabase, 'putDoc').mockResolvedValueOnce({ lastUpdate: 1000, doc })

      // act
      const result = db.putDoc(operationCode, path, doc)

      // assert
      await expect(result).rejects.toThrow(`Can't write invalid document: invalid A`)
    })

    it('should log the error if at least one put validator fails', async () => {
      // arrange
      const putValidator1: Validator = () => null
      const putValidator2: Validator = () => 'invalid A'
      const validators = { put: [putValidator1, putValidator2] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      const doc: Doc = { id: 'foo-1', rev: 0 }
      vi.spyOn(innerDatabase, 'putDoc').mockResolvedValueOnce({ lastUpdate: 1000, doc })

      // act
      await db.putDoc(operationCode, path, doc).catch(() => null)

      // assert
      const logMessages = logger('business:ValidatingDatabase').messages
      expect(logMessages).toEqual([
        '«test» [putDoc] Reject writing of invalid document foo/foo-1: invalid A',
        '«test»    {"id":"foo-1","rev":0}',
      ])
    })

    it('should throw an error if at least one get validator fails', async () => {
      // arrange
      const getValidator1: Validator = () => null
      const getValidator2: Validator = () => 'invalid Y'
      const validators = { get: [getValidator1, getValidator2] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      const doc: Doc = { id: 'foo-1', rev: 0 }
      vi.spyOn(innerDatabase, 'putDoc').mockResolvedValueOnce({ lastUpdate: 1000, doc })

      // act
      const result = db.putDoc(operationCode, path, doc)

      // assert
      await expect(result).rejects.toThrow(`Can't handle written document: invalid Y`)
    })

    it('should log the error if at least one get validator fails', async () => {
      // arrange
      const getValidator1: Validator = () => null
      const getValidator2: Validator = () => 'invalid Y'
      const validators = { get: [getValidator1, getValidator2] }
      const db = new ValidatingDatabase(logger, innerDatabase, validators)
      const path = { bucket: 'foo' }
      const doc: Doc = { id: 'foo-1', rev: 0 }
      vi.spyOn(innerDatabase, 'putDoc').mockResolvedValueOnce({ lastUpdate: 1000, doc })

      // act
      await db.putDoc(operationCode, path, doc).catch(() => null)

      // assert
      const logMessages = logger('business:ValidatingDatabase').messages
      expect(logMessages).toEqual([
        '«test» [putDoc] Ignore invalid written document foo/foo-1: invalid Y',
        '«test»    {"id":"foo-1","rev":0}',
      ])
    })
  })
})
