import { indexedDB as fakeIndexedDB } from 'fake-indexeddb'
import { RdbData } from '../rdb.service'

import { AbortError } from '../abort-error'
import { DBObject, IdbReadTransaction, IdbUpdateTransaction, wrapRequest } from './idb.transactions'

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
      } as RdbData,
    }
    const object2: DBObject = {
      changeIndex: 0,
      data: {
        id: 'test-id-2',
        payload: 'test-payload-2',
      } as RdbData,
    }
    const objectDeleted: DBObject = {
      changeIndex: 5,
      deleted: true,
      data: { id: 'test-id-deleted' },
    }

    describe('.abort', () => {
      it('should throw abort error', () => {
        const tx = db.transaction('test-store', 'readonly')
        const rtx = new IdbReadTransaction<'test-store'>(tx)
        expect(() => rtx.abort('test-abort-message')).toThrow(AbortError)
      })

      it('should throw error with given cause', () => {
        const tx = db.transaction('test-store', 'readonly')
        const rtx = new IdbReadTransaction<'test-store'>(tx)
        expect(() => rtx.abort('test-abort-message')).toThrowError('test-abort-message')
      })
    })

    describe('.getAll', () => {
      it('should read no data from empty store', async () => {
        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const rtx = new IdbReadTransaction<'test-store'>(tx)

        const data = await rtx.getAll('test-store')
        tx.commit()
        await finish

        expect(data).toEqual([])
      })

      it('should not fill meta record for reading from empty store', async () => {
        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const rtx = new IdbReadTransaction<'test-store'>(tx)

        await rtx.getAll('test-store')
        tx.commit()
        await finish

        expect(rtx.metaRecord).toEqual({})
      })

      it('should read all data from store', async () => {
        await addObject('test-store', object1)
        await addObject('test-store', object2)

        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const rtx = new IdbReadTransaction<'test-store'>(tx)

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
        const rtx = new IdbReadTransaction<'test-store'>(tx)

        await rtx.getAll('test-store')
        tx.commit()
        await finish

        expect(rtx.metaRecord).toEqual({
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
        const rtx = new IdbReadTransaction<'test-store'>(tx)

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
        const rtx = new IdbReadTransaction<'test-store'>(tx)

        await rtx.getAll('test-store')
        tx.commit()
        await finish

        expect(rtx.metaRecord).toEqual({
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
        const rtx = new IdbReadTransaction<'test-store'>(tx)

        const data = await rtx.get('test-store', 'test-id-1')
        tx.commit()
        await finish

        expect(data).toEqual({ id: 'test-id-1', payload: 'test-payload-1' })
      })

      it('should fill meta record for read data', async () => {
        await addObject('test-store', object1)

        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const rtx = new IdbReadTransaction<'test-store'>(tx)

        await rtx.get('test-store', 'test-id-1')
        tx.commit()
        await finish

        expect(rtx.metaRecord).toEqual({
          'test-id-1': { changeIndex: 3 },
        })
      })

      it('should return null for ID marked as deleted in store', async () => {
        await addObject('test-store', objectDeleted)

        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const rtx = new IdbReadTransaction<'test-store'>(tx)

        const data = await rtx.get('test-store', 'test-id-1')
        tx.commit()
        await finish

        expect(data).toBeNull()
      })

      it('should fill meta record for deleted data', async () => {
        await addObject('test-store', objectDeleted)

        const tx = db.transaction('test-store', 'readonly')
        const rtx = new IdbReadTransaction<'test-store'>(tx)

        await rtx.get('test-store', 'test-id-deleted')

        expect(rtx.metaRecord).toEqual({
          'test-id-deleted': { changeIndex: 5, deleted: true },
        })
      })

      it('should return null for ID not existing in store', async () => {
        const tx = db.transaction('test-store', 'readonly')
        const finish = wrapTransaction(tx)
        const rtx = new IdbReadTransaction<'test-store'>(tx)

        const data = await rtx.get('test-store', 'test-id-unknown')
        tx.commit()
        await finish

        expect(data).toBeNull()
      })

      it('should not fill meta record for reading unknown ID form store', async () => {
        const tx = db.transaction('test-store', 'readonly')
        const rtx = new IdbReadTransaction<'test-store'>(tx)

        await rtx.get('test-store', 'test-id-unknown').catch(() => undefined)

        expect(rtx.metaRecord).toEqual({
          'test-id-unknown': { changeIndex: NaN, deleted: true },
        })
      })
    })
  })

  describe(IdbUpdateTransaction.name, () => {
    describe('.abort', () => {
      it('should throw abort error', () => {
        const tx = db.transaction('test-store', 'readwrite')
        const rtx = new IdbUpdateTransaction<'test-store'>(tx)
        expect(() => rtx.abort('test-abort-message')).toThrow(AbortError)
      })

      it('should throw error with given cause', () => {
        const tx = db.transaction('test-store', 'readwrite')
        const rtx = new IdbUpdateTransaction<'test-store'>(tx)
        expect(() => rtx.abort('test-abort-message')).toThrowError('test-abort-message')
      })
    })

    describe('.add', () => {
      it('should store data', async () => {
        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

        await utx.add('test-store', { id: 'test-id-1', payload: 'test-payload-1' })
        tx.commit()
        await finish

        const data = await allObjects('test-store')
        expect(data).toEqual([{ changeIndex: 0, data: { id: 'test-id-1', payload: 'test-payload-1' } }])
      })

      it('should fill meta record for stored data', async () => {
        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

        await utx.add('test-store', { id: 'test-id-1', payload: 'test-payload-1' })
        tx.commit()
        await finish

        expect({ before: utx.beforeMetaRecord, after: utx.afterMetaRecord }).toEqual({
          before: { 'test-id-1': { changeIndex: NaN, deleted: true } },
          after: { 'test-id-1': { changeIndex: 0 } },
        })
      })

      it('should throw exception if added ID already exists in store', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-already-exists' } })

        const tx = db.transaction('test-store', 'readwrite')
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

        const act = utx.add('test-store', { id: 'test-id-already-exists', payload: 'test-payload' })

        expect(act).rejects.toThrowError(
          /A mutation operation in the transaction failed because a constraint was not satisfied./,
        )
      })

      it('should not fill meta record for rejected data', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-already-exists' } })

        const tx = db.transaction('test-store', 'readwrite')
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

        await utx.add('test-store', { id: 'test-id-already-exists', payload: 'test-payload' }).catch(() => undefined)

        expect({ before: utx.beforeMetaRecord, after: utx.afterMetaRecord }).toEqual({
          before: {},
          after: {},
        })
      })
    })

    describe('.update', () => {
      it('should store updated data', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-1' } })

        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

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
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

        await utx.update('test-store', { id: 'test-id-1', payload: 'test-payload-1' })
        tx.commit()
        await finish

        expect({ before: utx.beforeMetaRecord, after: utx.afterMetaRecord }).toEqual({
          before: { 'test-id-1': { changeIndex: 0 } },
          after: { 'test-id-1': { changeIndex: 1 } },
        })
      })

      it('should store twice updated data', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-1' } })

        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

        await utx.update('test-store', { id: 'test-id-1', payload: 'test-payload-X' })
        await utx.update('test-store', { id: 'test-id-1', payload: 'test-payload-Y' })
        tx.commit()
        await finish

        const data = await allObjects('test-store')
        expect(data).toEqual([{ changeIndex: 2, data: { id: 'test-id-1', payload: 'test-payload-Y' } }])
      })

      it('should fill meta record for twice updated data', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-1' } })

        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

        await utx.update('test-store', { id: 'test-id-1', payload: 'test-payload-X' })
        await utx.update('test-store', { id: 'test-id-1', payload: 'test-payload-Y' })
        tx.commit()
        await finish

        expect({ before: utx.beforeMetaRecord, after: utx.afterMetaRecord }).toEqual({
          before: { 'test-id-1': { changeIndex: 0 } },
          after: { 'test-id-1': { changeIndex: 2 } },
        })
      })

      it('should store data even if ID not exist before in store', async () => {
        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

        await utx.update('test-store', { id: 'test-id-new', payload: 'test-payload' })
        tx.commit()
        await finish

        const data = await allObjects('test-store')
        expect(data).toEqual([{ changeIndex: 0, data: { id: 'test-id-new', payload: 'test-payload' } }])
      })

      it('should fill meta record for updated data if ID not exist before in store', async () => {
        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

        await utx.update('test-store', { id: 'test-id-new', payload: 'test-payload' })
        tx.commit()
        await finish

        expect({ before: utx.beforeMetaRecord, after: utx.afterMetaRecord }).toEqual({
          before: { 'test-id-new': { changeIndex: NaN, deleted: true } },
          after: { 'test-id-new': { changeIndex: 0 } },
        })
      })
    })

    describe('.delete', () => {
      it('should mark data as deleted', async () => {
        addObject('test-store', { changeIndex: 0, data: { id: 'test-id-1' } })

        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

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
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

        await utx.delete('test-store', 'test-id-1')
        tx.commit()
        await finish

        expect({ before: utx.beforeMetaRecord, after: utx.afterMetaRecord }).toEqual({
          before: { 'test-id-1': { changeIndex: 0 } },
          after: { 'test-id-1': { changeIndex: 1, deleted: true } },
        })
      })

      it('should not change the data of object was already deleted', async () => {
        addObject('test-store', { changeIndex: 2, deleted: true, data: { id: 'test-id-already-deleted' } })

        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

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
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

        await utx.delete('test-store', 'test-id-already-deleted')
        tx.commit()
        await finish

        expect({ before: utx.beforeMetaRecord, after: utx.afterMetaRecord }).toEqual({
          before: { 'test-id-already-deleted': { changeIndex: 2, deleted: true } },
          after: { 'test-id-already-deleted': { changeIndex: 2, deleted: true } },
        })
      })

      it('should not store data if ID not exist before in store', async () => {
        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

        await utx.delete('test-store', 'test-id-new')
        tx.commit()
        await finish

        const data = await allObjects('test-store')
        expect(data).toEqual([])
      })

      it('should fill meta record for deleted data if ID not exist before in store', async () => {
        const tx = db.transaction('test-store', 'readwrite')
        const finish = wrapTransaction(tx)
        const utx = new IdbUpdateTransaction<'test-store'>(tx)

        await utx.delete('test-store', 'test-id-new')
        tx.commit()
        await finish

        expect({ before: utx.beforeMetaRecord, after: utx.afterMetaRecord }).toEqual({
          before: { 'test-id-new': { changeIndex: NaN, deleted: true } },
          after: { 'test-id-new': { changeIndex: NaN, deleted: true } },
        })
      })
    })
  })
})
