import { IDBFactory } from 'fake-indexeddb'
import { subject } from '../helpers/subject'
import { IdbService } from './idb.service'

// more generic tests in ../rdb.service.spec.ts

const onBlocked = vi.fn()

async function openDB(indexedDB: IDBFactory, dbId: string, dbVersion: number) {
  const db = await new Promise<IDBDatabase>((resolved) => {
    const request = indexedDB.open(dbId, dbVersion)
    request.onsuccess = () => resolved(request.result)
  })
  return db
}

describe(IdbService.name, () => {
  describe('.openDB', () => {
    it('should open a database', async () => {
      const indexedDB = new IDBFactory()
      const idbService = new IdbService(indexedDB, 'test.db', 1, () => {})

      const opened = new Promise<void>((resolve, reject) => {
        idbService.openDB({
          onBlocked: () => {},
          onError: reject,
          onOpen: resolve,
        })
      })

      await opened

      const databases = await indexedDB.databases()
      expect(databases).toEqual([{ name: 'test.db', version: 1 }])
    })

    it('should call upgrade function with version 0=>newVersion for new DBs', async () => {
      const newVersion = 2
      const upgrades = vi.fn()

      const indexedDB = new IDBFactory()
      const idbService = new IdbService(indexedDB, 'test.db', newVersion, upgrades)

      const opened = new Promise<void>((onOpen, onError) => {
        idbService.openDB({ onBlocked, onOpen, onError })
      })

      await opened

      expect(upgrades).toBeCalledTimes(1)
      expect(upgrades.mock.calls[0][0]).toMatchObject({
        oldVersion: 0,
        newVersion: 2,
      })
    })

    it('should not call upgrade function for existing DB with matching version', async () => {
      const version = 2
      const upgrades = vi.fn()

      const indexedDB = new IDBFactory()
      await openDB(indexedDB, 'test.db', version).then((db) => db.close())
      const idbService = new IdbService(indexedDB, 'test.db', version, upgrades)

      const opened = new Promise<void>((onOpen, onError) => {
        idbService.openDB({ onBlocked, onOpen, onError })
      })

      await opened

      expect(upgrades).not.toBeCalled()
    })

    it('should not call upgrade function for existing DB with lower version', async () => {
      const [oldVersion, newVersion] = [2, 8]
      const upgrades = vi.fn()

      const indexedDB = new IDBFactory()
      await openDB(indexedDB, 'test.db', oldVersion).then((db) => db.close())
      const idbService = new IdbService(indexedDB, 'test.db', newVersion, upgrades)

      const opened = new Promise<void>((onOpen, onError) => {
        idbService.openDB({ onBlocked, onOpen, onError })
      })

      await opened

      expect(upgrades.mock.calls[0][0]).toMatchObject({ oldVersion, newVersion })
    })

    it('should block upgrade until other DB with lower version was closed', async () => {
      const [oldVersion, newVersion] = [2, 8]
      const blocked = subject<boolean>()
      const upgrades = vi.fn()

      const indexedDB = new IDBFactory()
      const otherDB = await openDB(indexedDB, 'test.db', oldVersion)
      const idbService = new IdbService(indexedDB, 'test.db', newVersion, upgrades)

      const opened = new Promise<void>((onOpen, onError) => {
        idbService.openDB({ onBlocked: () => blocked.resolve(true), onOpen, onError })
      })

      await blocked
      expect(upgrades).not.toBeCalled()
      otherDB.close()

      await opened
      expect(upgrades).toBeCalledTimes(1)
    })

    it('should not call upgrade function for existing DB with lower version', async () => {
      const [oldVersion, newVersion] = [8, 2]
      const upgrades = vi.fn()

      const indexedDB = new IDBFactory()
      await openDB(indexedDB, 'test.db', oldVersion).then((db) => db.close())
      const idbService = new IdbService(indexedDB, 'test.db', newVersion, upgrades)

      const opened = new Promise<void>((onOpen, onError) => {
        idbService.openDB({ onBlocked, onOpen, onError })
      })

      expect(opened).rejects.toThrowError()
    })

    it('should create stores with upgrade function', async () => {
      const version = 2

      const indexedDB = new IDBFactory()
      const idbService = new IdbService(indexedDB, 'test.db', version, ({ db }) => {
        db.createObjectStore('foo')
        db.createObjectStore('bar')
      })

      const opened = new Promise<void>((onOpen, onError) => {
        idbService.openDB({ onBlocked, onOpen, onError })
      })

      await opened

      const db = await openDB(indexedDB, 'test.db', version)
      const tx = db.transaction(['foo', 'bar'], 'readonly')
      expect(tx.objectStore('foo')).toBeTruthy()
      expect(tx.objectStore('bar')).toBeTruthy()
    })
  })
})
