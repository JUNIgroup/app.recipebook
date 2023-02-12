import { indexedDB as fakeIndexedDB } from 'fake-indexeddb'

import { AbortError } from './db.errors'
import { DBObjectMetaData, DBObjectState, OutdatedCause } from './db.types'
import {
  convertReadMetaRecordToMetaData,
  convertUpdateMetaRecordToMetaData,
  Data,
  DBObject,
  IdbReadTransaction,
  IdbUpdateTransaction,
  ReadMetaRecord,
  UpdateMetaRecord,
  validateUpdateMetaRecord,
  wrapRequest,
} from './idb.transactions'

describe('wrapRequest', () => {
  it('should listen on success', () => {
    const request: IDBRequest = {} as IDBRequest
    wrapRequest(request)
    expect(request.onsuccess).toBeDefined()
  })

  it('should be able to resolve on successful request', async () => {
    const request: IDBRequest = { result: 'test-request-result' } as IDBRequest
    const wrapped = wrapRequest(request)
    request.onsuccess?.({} as Event)
    await expect(wrapped).resolves.toEqual('test-request-result')
  })

  it('should listen on error', () => {
    const request: IDBRequest = {} as IDBRequest
    wrapRequest(request)
    expect(request.onerror).toBeDefined()
  })

  it('should be able to reject on failed request', async () => {
    const request: IDBRequest = { error: new Error('test-request-failed') } as IDBRequest
    const wrapped = wrapRequest(request)
    request.onerror?.({} as Event)
    await expect(wrapped).rejects.toEqual(new Error('test-request-failed'))
  })
})

describe('transactions', () => {
  let db: IDBDatabase

  beforeEach(async () => {
    const request: IDBOpenDBRequest = fakeIndexedDB.open('test', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('test-store', { keyPath: 'data.id' })
    }
    db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result)
    })
  })

  afterEach(() => {
    db.close()
    fakeIndexedDB.deleteDatabase('test')
  })

  function wrapTransaction(transaction: IDBTransaction) {
    const tx = transaction
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(transaction.error)
    })
  }

  async function addObject(storeName: string, object: DBObject) {
    const tx = db.transaction(storeName, 'readwrite')
    const finish = wrapTransaction(tx)
    const store = tx.objectStore(storeName)
    store.add(object)
    tx.commit()
    await finish
  }

  async function allObjects(storeName: string) {
    const tx = db.transaction(storeName, 'readonly')
    const finish = wrapTransaction(tx)
    const store = tx.objectStore(storeName)
    const allRequest = store.getAll()
    tx.commit()
    await finish
    return allRequest.result
  }

  it('should be the DB open', () => {
    expect(db).toBeDefined()
  })

  describe(IdbReadTransaction.name, () => {
    const object1: DBObject = {
      changeIndex: 3,
      data: {
        id: 'test-id-1',
        payload: 'test-payload-1',
      } as Data,
    }
    const object2: DBObject = {
      changeIndex: 0,
      data: {
        id: 'test-id-2',
        payload: 'test-payload-2',
      } as Data,
    }
    const objectDeleted: DBObject = {
      changeIndex: 5,
      deleted: true,
      data: { id: 'test-id-deleted' },
    }

    describe('.abort', () => {
      it('should throw abort error', () => {
        const tx = db.transaction('test-store', 'readonly')
        const rtx = new IdbReadTransaction(tx, {})
        expect(() => rtx.abort('test-abort-message')).toThrow(AbortError)
      })

      it('should throw error with given cause', () => {
        const tx = db.transaction('test-store', 'readonly')
        const rtx = new IdbReadTransaction(tx, {})
        expect(() => rtx.abort('test-abort-message')).toThrowError('test-abort-message')
      })
    })

    describe('.getAll', () => {
      it('should read no data from empty store', async () => {
        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const rtx = new IdbReadTransaction(tx, {})

        const data = await rtx.getAll('test-store')
        tx.commit()
        await finish

        expect(data).toEqual([])
      })

      it('should not fill meta record for reading from empty store', async () => {
        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const metaRecord: ReadMetaRecord = {}
        const rtx = new IdbReadTransaction(tx, metaRecord)

        await rtx.getAll('test-store')
        tx.commit()
        await finish

        expect(metaRecord).toEqual({})
      })

      it('should read all data from store', async () => {
        await addObject('test-store', object1)
        await addObject('test-store', object2)

        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const rtx = new IdbReadTransaction(tx, {})

        const data = await rtx.getAll('test-store')
        tx.commit()
        await finish

        expect(data).toEqual([
          { id: 'test-id-1', payload: 'test-payload-1' },
          { id: 'test-id-2', payload: 'test-payload-2' },
        ])
      })

      it('should fill meta record for all read data', async () => {
        await addObject('test-store', object1)
        await addObject('test-store', object2)

        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const metaRecord: ReadMetaRecord = {}
        const rtx = new IdbReadTransaction(tx, metaRecord)

        await rtx.getAll('test-store')
        tx.commit()
        await finish

        expect(metaRecord).toEqual({
          'test-id-1': { changeIndex: 3 },
          'test-id-2': { changeIndex: 0 },
        })
      })

      it('should read all non-deleted data from store', async () => {
        await addObject('test-store', object1)
        await addObject('test-store', object2)
        await addObject('test-store', objectDeleted)

        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const rtx = new IdbReadTransaction(tx, {})

        const data = await rtx.getAll('test-store')
        tx.commit()
        await finish

        expect(data).toEqual([
          { id: 'test-id-1', payload: 'test-payload-1' },
          { id: 'test-id-2', payload: 'test-payload-2' },
        ])
      })

      it('should fill meta record for deleted and non-deleted read data', async () => {
        await addObject('test-store', object1)
        await addObject('test-store', object2)
        await addObject('test-store', objectDeleted)

        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const metaRecord: ReadMetaRecord = {}
        const rtx = new IdbReadTransaction(tx, metaRecord)

        await rtx.getAll('test-store')
        tx.commit()
        await finish

        expect(metaRecord).toEqual({
          'test-id-1': { changeIndex: 3 },
          'test-id-2': { changeIndex: 0 },
          'test-id-deleted': { changeIndex: 5, deleted: true },
        })
      })
    })

    describe('.get', () => {
      it('should read data from store', async () => {
        await addObject('test-store', object1)

        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const rtx = new IdbReadTransaction(tx, {})

        const data = await rtx.get('test-store', 'test-id-1')
        tx.commit()
        await finish

        expect(data).toEqual({ id: 'test-id-1', payload: 'test-payload-1' })
      })

      it('should fill meta record for read data', async () => {
        await addObject('test-store', object1)

        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const metaRecord: ReadMetaRecord = {}
        const rtx = new IdbReadTransaction(tx, metaRecord)

        await rtx.get('test-store', 'test-id-1')
        tx.commit()
        await finish

        expect(metaRecord).toEqual({
          'test-id-1': { changeIndex: 3 },
        })
      })

      it('should return null for ID marked as deleted in store', async () => {
        await addObject('test-store', objectDeleted)

        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const rtx = new IdbReadTransaction(tx, {})

        const data = await rtx.get('test-store', 'test-id-1')
        tx.commit()
        await finish

        expect(data).toBeNull()
      })

      it('should fill meta record for deleted data', async () => {
        await addObject('test-store', objectDeleted)

        const tx = db.transaction('test-store', 'readonly')
        const metaRecord: ReadMetaRecord = {}
        const rtx = new IdbReadTransaction(tx, metaRecord)

        await rtx.get('test-store', 'test-id-deleted')

        expect(metaRecord).toEqual({
          'test-id-deleted': { changeIndex: 5, deleted: true },
        })
      })

      it('should return null for ID not existing in store', async () => {
        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const rtx = new IdbReadTransaction(tx, {})

        const data = await rtx.get('test-store', 'test-id-unknown')
        tx.commit()
        await finish

        expect(data).toBeNull()
      })

      it('should not fill meta record for reading unknown ID form store', async () => {
        const tx = db.transaction('test-store', 'readonly')
        const metaRecord: ReadMetaRecord = {}
        const rtx = new IdbReadTransaction(tx, metaRecord)

        await rtx.get('test-store', 'test-id-unknown').catch(() => undefined)

        expect(metaRecord).toEqual({
          'test-id-unknown': { changeIndex: NaN, deleted: true },
        })
      })
    })
  })

  describe(IdbUpdateTransaction.name, () => {
    describe('.abort', () => {
      it('should throw abort error', () => {
        const tx = db.transaction('test-store', 'readwrite')
        const rtx = new IdbUpdateTransaction(tx, {})
        expect(() => rtx.abort('test-abort-message')).toThrow(AbortError)
      })

      it('should throw error with given cause', () => {
        const tx = db.transaction('test-store', 'readwrite')
        const rtx = new IdbUpdateTransaction(tx, {})
        expect(() => rtx.abort('test-abort-message')).toThrowError('test-abort-message')
      })
    })

    describe('.add', () => {
      it('should store data', async () => {
        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction(tx, {})

        await utx.add('test-store', { id: 'test-id-1', payload: 'test-payload-1' })
        tx.commit()
        await finish

        const data = await allObjects('test-store')
        expect(data).toEqual([{ changeIndex: 0, data: { id: 'test-id-1', payload: 'test-payload-1' } }])
      })

      it('should fill meta record for stored data', async () => {
        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const metaRecord: UpdateMetaRecord = {}
        const utx = new IdbUpdateTransaction(tx, metaRecord)

        await utx.add('test-store', { id: 'test-id-1', payload: 'test-payload-1' })
        tx.commit()
        await finish

        expect(metaRecord).toEqual({
          'test-id-1': {
            before: undefined,
            after: { changeIndex: 0, data: { id: 'test-id-1', payload: 'test-payload-1' } },
          },
        })
      })

      it('should throw exception if added ID already exists in store', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-already-exists' } })

        const tx = db.transaction('test-store', 'readwrite')
        const utx = new IdbUpdateTransaction(tx, {})

        const act = utx.add('test-store', { id: 'test-id-already-exists', payload: 'test-payload' })

        expect(act).rejects.toThrowError(
          /A mutation operation in the transaction failed because a constraint was not satisfied./,
        )
      })

      it('should not fill meta record for rejected data', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-already-exists' } })

        const tx = db.transaction('test-store', 'readwrite')
        const metaRecord: UpdateMetaRecord = {}
        const utx = new IdbUpdateTransaction(tx, metaRecord)

        await utx.add('test-store', { id: 'test-id-already-exists', payload: 'test-payload' }).catch(() => undefined)

        expect(metaRecord).toEqual({})
      })
    })

    describe('.update', () => {
      it('should store updated data', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-1' } })

        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction(tx, {})

        await utx.update('test-store', { id: 'test-id-1', payload: 'test-payload-1' })
        tx.commit()
        await finish

        const data = await allObjects('test-store')
        expect(data).toEqual([{ changeIndex: 1, data: { id: 'test-id-1', payload: 'test-payload-1' } }])
      })

      it('should fill meta record for updated data', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-1' } })

        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const metaRecord: UpdateMetaRecord = {}
        const utx = new IdbUpdateTransaction(tx, metaRecord)

        await utx.update('test-store', { id: 'test-id-1', payload: 'test-payload-1' })
        tx.commit()
        await finish

        expect(metaRecord).toEqual({
          'test-id-1': {
            before: { changeIndex: 0, data: { id: 'test-id-1' } },
            after: { changeIndex: 1, data: { id: 'test-id-1', payload: 'test-payload-1' } },
          },
        })
      })

      it('should store twice updated data', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-1' } })

        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction(tx, {})

        await utx.update('test-store', { id: 'test-id-1', payload: 'test-payload-X' })
        await utx.update('test-store', { id: 'test-id-1', payload: 'test-payload-Y' })
        tx.commit()
        await finish

        const data = await allObjects('test-store')
        expect(data).toEqual([{ changeIndex: 1, data: { id: 'test-id-1', payload: 'test-payload-Y' } }])
      })

      it('should fill meta record for twice updated data', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-1' } })

        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const metaRecord: UpdateMetaRecord = {}
        const utx = new IdbUpdateTransaction(tx, metaRecord)

        await utx.update('test-store', { id: 'test-id-1', payload: 'test-payload-X' })
        await utx.update('test-store', { id: 'test-id-1', payload: 'test-payload-Y' })
        tx.commit()
        await finish

        expect(metaRecord).toEqual({
          'test-id-1': {
            before: { changeIndex: 0, data: { id: 'test-id-1' } },
            after: { changeIndex: 1, data: { id: 'test-id-1', payload: 'test-payload-Y' } },
          },
        })
      })

      it('should store data even if ID not exist before in store', async () => {
        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction(tx, {})

        await utx.update('test-store', { id: 'test-id-new', payload: 'test-payload' })
        tx.commit()
        await finish

        const data = await allObjects('test-store')
        expect(data).toEqual([{ changeIndex: 0, data: { id: 'test-id-new', payload: 'test-payload' } }])
      })

      it('should fill meta record for updated data if ID not exist before in store', async () => {
        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const metaRecord: UpdateMetaRecord = {}
        const utx = new IdbUpdateTransaction(tx, metaRecord)

        await utx.update('test-store', { id: 'test-id-new', payload: 'test-payload' })
        tx.commit()
        await finish

        expect(metaRecord).toEqual({
          'test-id-new': {
            before: { changeIndex: NaN, deleted: true, data: { id: 'test-id-new' } },
            after: { changeIndex: 0, data: { id: 'test-id-new', payload: 'test-payload' } },
          },
        })
      })
    })

    describe('.delete', () => {
      it('should mark data as deleted', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-1' } })

        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction(tx, {})

        await utx.delete('test-store', 'test-id-1')
        tx.commit()
        await finish

        const data = await allObjects('test-store')
        expect(data).toEqual([{ changeIndex: 1, deleted: true, data: { id: 'test-id-1' } }])
      })

      it('should fill meta record for deleted data', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-1' } })

        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const metaRecord: UpdateMetaRecord = {}
        const utx = new IdbUpdateTransaction(tx, metaRecord)

        await utx.delete('test-store', 'test-id-1')
        tx.commit()
        await finish

        expect(metaRecord).toEqual({
          'test-id-1': {
            before: { changeIndex: 0, data: { id: 'test-id-1' } },
            after: { changeIndex: 1, deleted: true, data: { id: 'test-id-1' } },
          },
        })
      })

      it('should not change the data of object was already deleted', async () => {
        addObject('test-store', { changeIndex: 2, deleted: true, data: { id: 'test-id-already-deleted' } })

        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction(tx, {})

        await utx.delete('test-store', 'test-id-already-deleted')
        tx.commit()
        await finish

        const data = await allObjects('test-store')
        expect(data).toEqual([{ changeIndex: 2, deleted: true, data: { id: 'test-id-already-deleted' } }])
      })

      it('should fill meta record for already deleted data', async () => {
        addObject('test-store', { changeIndex: 2, deleted: true, data: { id: 'test-id-already-deleted' } })

        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const metaRecord: UpdateMetaRecord = {}
        const utx = new IdbUpdateTransaction(tx, metaRecord)

        await utx.delete('test-store', 'test-id-already-deleted')
        tx.commit()
        await finish

        expect(metaRecord).toEqual({
          'test-id-already-deleted': {
            before: { changeIndex: 2, deleted: true, data: { id: 'test-id-already-deleted' } },
            after: { changeIndex: 2, deleted: true, data: { id: 'test-id-already-deleted' } },
          },
        })
      })

      it('should not store data if ID not exist before in store', async () => {
        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction(tx, {})

        await utx.delete('test-store', 'test-id-new')
        tx.commit()
        await finish

        const data = await allObjects('test-store')
        expect(data).toEqual([])
      })

      it('should fill meta record for deleted data if ID not exist before in store', async () => {
        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const metaRecord: UpdateMetaRecord = {}
        const utx = new IdbUpdateTransaction(tx, metaRecord)

        await utx.delete('test-store', 'test-id-new')
        tx.commit()
        await finish

        expect(metaRecord).toEqual({
          'test-id-new': {
            before: { changeIndex: NaN, deleted: true, data: { id: 'test-id-new' } },
            after: { changeIndex: NaN, deleted: true, data: { id: 'test-id-new' } },
          },
        })
      })
    })
  })
})

describe(convertReadMetaRecordToMetaData.name, () => {
  it('should return meta data of meta record of changed data', () => {
    const metaRecord: ReadMetaRecord = {
      'test-id-1': { changeIndex: 3 },
      'test-id-2': { changeIndex: 1 },
    }

    const metaData = convertReadMetaRecordToMetaData(metaRecord)

    expect(metaData).toEqual([
      { id: 'test-id-1', changeIndex: 3, state: DBObjectState.CACHED },
      { id: 'test-id-2', changeIndex: 1, state: DBObjectState.CACHED },
    ])
  })

  it('should return meta data of meta record of deleted data', () => {
    const metaRecord: ReadMetaRecord = {
      'test-id-3': { changeIndex: 5, deleted: true },
    }

    const metaData = convertReadMetaRecordToMetaData(metaRecord)

    expect(metaData).toEqual([
      { id: 'test-id-3', changeIndex: 5, state: DBObjectState.DELETED }, //
    ])
  })

  it('should return meta data of meta record of not found data', () => {
    const metaRecord: ReadMetaRecord = {
      'test-id-4': { changeIndex: NaN, deleted: true },
    }

    const metaData = convertReadMetaRecordToMetaData(metaRecord)

    expect(metaData).toEqual([
      { id: 'test-id-4', changeIndex: NaN, state: DBObjectState.DELETED }, //
    ])
  })
})

describe(convertUpdateMetaRecordToMetaData.name, () => {
  it('should return meta data of meta record of added data', () => {
    const metaRecord: UpdateMetaRecord = {
      'test-id-1': {
        before: undefined,
        after: { changeIndex: 0, data: { id: 'test-id-1' } },
      },
    }
    const metaData = convertUpdateMetaRecordToMetaData(metaRecord)

    expect(metaData).toEqual([
      { id: 'test-id-1', changeIndex: 0, state: DBObjectState.CACHED }, //
    ])
  })

  it('should return meta data of meta record of updated data', () => {
    const metaRecord: UpdateMetaRecord = {
      'test-id-2': {
        before: { changeIndex: 0, data: { id: 'test-id-2' } },
        after: { changeIndex: 1, data: { id: 'test-id-2' } },
      },
      'test-id-3': {
        before: { changeIndex: 3, data: { id: 'test-id-3' } },
        after: { changeIndex: 5, data: { id: 'test-id-3' } },
      },
      'test-id-4': {
        before: undefined,
        after: { changeIndex: 0, data: { id: 'test-id-4' } },
      },
    }

    const metaData = convertUpdateMetaRecordToMetaData(metaRecord)

    expect(metaData).toEqual([
      { id: 'test-id-2', changeIndex: 1, state: DBObjectState.CACHED },
      { id: 'test-id-3', changeIndex: 5, state: DBObjectState.CACHED },
      { id: 'test-id-4', changeIndex: 0, state: DBObjectState.CACHED },
    ])
  })

  it('should return meta data of meta record of deleted data', () => {
    const metaRecord: UpdateMetaRecord = {
      'test-id-5': {
        before: { changeIndex: 3, data: { id: 'test-id-5' } },
        after: { changeIndex: 4, deleted: true, data: { id: 'test-id-5' } },
      },
      'test-id-6': {
        before: { changeIndex: 5, deleted: true, data: { id: 'test-id-6' } },
        after: { changeIndex: 5, deleted: true, data: { id: 'test-id-6' } },
      },
      'test-id-7': {
        before: { changeIndex: NaN, deleted: true, data: { id: 'test-id-7' } },
        after: { changeIndex: 0, deleted: true, data: { id: 'test-id-7' } },
      },
    }

    const metaData = convertUpdateMetaRecordToMetaData(metaRecord)

    expect(metaData).toEqual([
      { id: 'test-id-5', changeIndex: 4, state: DBObjectState.DELETED },
      { id: 'test-id-6', changeIndex: 5, state: DBObjectState.DELETED },
      { id: 'test-id-7', changeIndex: 0, state: DBObjectState.DELETED },
    ])
  })
})

describe(validateUpdateMetaRecord.name, () => {
  describe('valid update operations', () => {
    it('should return null, if meta record before and initial meta data are not defined (add operation)', () => {
      const metaRecord: UpdateMetaRecord = {
        'test-id-1': {
          before: undefined,
          after: { changeIndex: 0, data: { id: 'test-id-1' } },
        },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {}

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toBeNull()
    })

    it('should return null, if meta record before matches initial meta data (update/delete operation)', () => {
      const metaRecord: UpdateMetaRecord = {
        'test-id-1': {
          before: { changeIndex: 1, data: { id: 'test-id-1' } },
          after: { changeIndex: 2, data: { id: 'test-id-1' } },
        },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {
        'test-id-1': { id: 'test-id-1', changeIndex: 1, state: DBObjectState.CACHED },
      }

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toBeNull()
    })

    it('should return null, if meta record before matches initial meta data (already deleted)', () => {
      const metaRecord: UpdateMetaRecord = {
        'test-id-1': {
          before: { changeIndex: 1, deleted: true, data: { id: 'test-id-1' } },
          after: { changeIndex: 1, deleted: true, data: { id: 'test-id-1' } },
        },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {
        'test-id-1': { id: 'test-id-1', changeIndex: 1, state: DBObjectState.DELETED },
      }

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toBeNull()
    })
  })

  describe('aborted update operations because of outdated local data', () => {
    it('should return outdated object with cause "local not found", if initial meta data for ID is undefined', () => {
      const metaRecord: UpdateMetaRecord = {
        'test-id-1': {
          before: { changeIndex: 1, data: { id: 'test-id-1' } },
          after: { changeIndex: 2, data: { id: 'test-id-1' } },
        },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {}

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toEqual({
        'test-id-1': OutdatedCause.LOCAL_NOT_FOUND,
      })
    })

    it('should return outdated object with cause "remote not found", if meta record before for ID is undefined', () => {
      const metaRecord: UpdateMetaRecord = {
        'test-id-1': {
          before: undefined,
          after: { changeIndex: 2, data: { id: 'test-id-1' } },
        },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {
        'test-id-1': { id: 'test-id-1', changeIndex: 1, state: DBObjectState.CACHED },
      }

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toEqual({
        'test-id-1': OutdatedCause.REMOTE_NOT_FOUND,
      })
    })

    it('should return outdated object with cause "remote delete", if meta record before is marked as deleted', () => {
      const metaRecord: UpdateMetaRecord = {
        'test-id-1': {
          before: { changeIndex: 1, deleted: true, data: { id: 'test-id-1' } },
          after: { changeIndex: 2, data: { id: 'test-id-1' } },
        },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {
        'test-id-1': { id: 'test-id-1', changeIndex: 0, state: DBObjectState.CACHED },
      }

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toEqual({
        'test-id-1': OutdatedCause.REMOTE_DELETED,
      })
    })

    it('should return outdated object with cause "remote modified", if meta record before has other change version', () => {
      const metaRecord: UpdateMetaRecord = {
        'test-id-1': {
          before: { changeIndex: 3, data: { id: 'test-id-1' } },
          after: { changeIndex: 4, data: { id: 'test-id-1' } },
        },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {
        'test-id-1': { id: 'test-id-1', changeIndex: 1, state: DBObjectState.CACHED },
      }

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toEqual({
        'test-id-1': OutdatedCause.REMOTE_MODIFIED,
      })
    })
  })

  describe('multiple update operations', () => {
    it('should return outdated objects with cause', () => {
      const metaRecord: UpdateMetaRecord = {
        'up-to-date-1': {
          before: undefined,
          after: { changeIndex: 0, data: { id: 'up-to-date-1' } },
        },
        'up-to-date-2': {
          before: { changeIndex: 1, data: { id: 'up-to-date-2' } },
          after: { changeIndex: 2, data: { id: 'up-to-date-2' } },
        },
        'up-to-date-3': {
          before: { changeIndex: 1, deleted: true, data: { id: 'up-to-date-3' } },
          after: { changeIndex: 1, deleted: true, data: { id: 'up-to-date-3' } },
        },
        'outdated-1': {
          before: { changeIndex: 1, data: { id: 'outdated-1' } },
          after: { changeIndex: 2, data: { id: 'outdated-1' } },
        },
        'outdated-2': {
          before: undefined,
          after: { changeIndex: 2, data: { id: 'outdated-2' } },
        },
        'outdated-3': {
          before: { changeIndex: 1, deleted: true, data: { id: 'outdated-3' } },
          after: { changeIndex: 2, data: { id: 'outdated-3' } },
        },
        'outdated-4': {
          before: { changeIndex: 3, data: { id: 'outdated-4' } },
          after: { changeIndex: 4, data: { id: 'outdated-4' } },
        },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {
        // up-to-date-1: undefined
        'up-to-date-2': { id: 'up-to-date-2', changeIndex: 1, state: DBObjectState.CACHED },
        'up-to-date-3': { id: 'up-to-date-3', changeIndex: 1, state: DBObjectState.DELETED },
        // outdated-1: undefined
        'outdated-2': { id: 'outdated-2', changeIndex: 1, state: DBObjectState.CACHED },
        'outdated-3': { id: 'outdated-3', changeIndex: 0, state: DBObjectState.CACHED },
        'outdated-4': { id: 'outdated-4', changeIndex: 1, state: DBObjectState.CACHED },
      }

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toEqual({
        'outdated-1': OutdatedCause.LOCAL_NOT_FOUND,
        'outdated-2': OutdatedCause.REMOTE_NOT_FOUND,
        'outdated-3': OutdatedCause.REMOTE_DELETED,
        'outdated-4': OutdatedCause.REMOTE_MODIFIED,
      })
    })
  })
})
