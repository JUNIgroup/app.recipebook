import { IDBFactory } from 'fake-indexeddb'
import { lastValueFrom, tap } from 'rxjs'
import { Logger } from '../../../utilities/logger'
import { createFakeLogger } from '../../../utilities/logger/fake-logger.test-helper'
import { collectFrom } from '../helpers/collect-from'
import { IdbService } from './idb.service'

// more generic tests in ../rdb.service.spec.ts

async function openDB(indexedDB: IDBFactory, dbId: string, dbVersion: number) {
  const db = await new Promise<IDBDatabase>((resolved) => {
    const request = indexedDB.open(dbId, dbVersion)
    request.onsuccess = () => resolved(request.result)
  })
  return db
}

describe(IdbService.name, () => {
  let logger: Logger

  beforeEach(() => {
    logger = createFakeLogger()
  })

  describe('.openDB', () => {
    it('should open a database', async () => {
      const indexedDB = new IDBFactory()
      const idbService = new IdbService(indexedDB, 'test.db', 1, () => {}, logger)

      await lastValueFrom(idbService.openDB())

      const databases = await indexedDB.databases()
      expect(databases).toEqual([{ name: 'test.db', version: 1 }])
    })

    it('should call upgrade function with version 0=>newVersion for new DBs', async () => {
      const newVersion = 2
      const upgrades = vi.fn()

      const indexedDB = new IDBFactory()
      const idbService = new IdbService(indexedDB, 'test.db', newVersion, upgrades, logger)

      await lastValueFrom(idbService.openDB())

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
      const idbService = new IdbService(indexedDB, 'test.db', version, upgrades, logger)

      await lastValueFrom(idbService.openDB())

      expect(upgrades).not.toBeCalled()
    })

    it('should not call upgrade function for existing DB with lower version', async () => {
      const [oldVersion, newVersion] = [2, 8]
      const upgrades = vi.fn()

      const indexedDB = new IDBFactory()
      await openDB(indexedDB, 'test.db', oldVersion).then((db) => db.close())
      const idbService = new IdbService(indexedDB, 'test.db', newVersion, upgrades, logger)

      await lastValueFrom(idbService.openDB())

      expect(upgrades.mock.calls[0][0]).toMatchObject({ oldVersion, newVersion })
    })

    it('should block upgrade until other DB with lower version was closed', async () => {
      const [oldVersion, newVersion] = [2, 8]
      const upgrades = vi.fn()

      const indexedDB = new IDBFactory()
      const otherDB = await openDB(indexedDB, 'test.db', oldVersion)
      const idbService = new IdbService(indexedDB, 'test.db', newVersion, upgrades, logger)

      const state$ = idbService.openDB().pipe(
        tap((state) => {
          switch (state) {
            case 'blocked':
              expect(upgrades).not.toBeCalled()
              otherDB.close()
              break
            case 'open':
              expect(upgrades).toBeCalledTimes(1)
              break
            default:
              break
          }
        }),
      )

      const states = await collectFrom(state$)
      expect(states).toEqual(['blocked', 'open'])
    })

    it('should not call upgrade function for existing DB with lower version', async () => {
      const [oldVersion, newVersion] = [8, 2]
      const upgrades = vi.fn()

      const indexedDB = new IDBFactory()
      await openDB(indexedDB, 'test.db', oldVersion).then((db) => db.close())
      const idbService = new IdbService(indexedDB, 'test.db', newVersion, upgrades, logger)

      const opened = lastValueFrom(idbService.openDB())

      expect(opened).rejects.toThrowError()
    })

    it('should create stores with upgrade function', async () => {
      const version = 2

      const indexedDB = new IDBFactory()
      const idbService = new IdbService(
        indexedDB,
        'test.db',
        version,
        ({ db }) => {
          db.createObjectStore('foo')
          db.createObjectStore('bar')
        },
        logger,
      )

      await lastValueFrom(idbService.openDB())

      const db = await openDB(indexedDB, 'test.db', version)
      const tx = db.transaction(['foo', 'bar'], 'readonly')
      expect(tx.objectStore('foo')).toBeTruthy()
      expect(tx.objectStore('bar')).toBeTruthy()
    })
  })
})
