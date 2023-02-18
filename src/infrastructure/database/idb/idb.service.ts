import { Observable, Subject } from 'rxjs'
import { IDB_ID } from '../../../app.constants'
import { Logger, ServiceLogger } from '../../logger/logger'
import { MetaRecord, RdbService, ReadCallbacks, UpdateCallbacks } from '../rdb.service'
import { IdbReadTransaction, IdbUpdateTransaction } from './idb.transactions'

const serviceName = 'IdbService'

const createLogger = ServiceLogger(serviceName)

const DELETE_VERSION = -1

type IdbTransactionCallback<T> = (tx: IDBTransaction) => Promise<T>

export type IdbUpgrades = (args: { db: IDBDatabase; oldVersion: number; newVersion: number; logger: Logger }) => void

export class IdbService<SupportedStoreName extends string> implements RdbService<SupportedStoreName> {
  private db: IDBDatabase | null = null

  constructor(
    private idb: IDBFactory,
    private dbId: string,
    private dbVersion: number,
    private dbUpgrades: IdbUpgrades,
  ) {}

  /**
   * Open the DB.
   *
   * Emit 'blocked' if the DB is blocked by another tab.
   * Emit 'open' if the DB is opened.
   *
   * Handle the upgrade of the DB if needed.
   */
  openDB(): Observable<'blocked' | 'open'> {
    const state$ = new Subject<'blocked' | 'open'>()
    const logger = createLogger('openDB')
    const request: IDBOpenDBRequest = this.idb.open(this.dbId, this.dbVersion)

    request.onupgradeneeded = ({ oldVersion, newVersion }: IDBVersionChangeEvent) => {
      if (newVersion && oldVersion < newVersion) {
        logger.log('upgrade from version %d to %d', oldVersion, newVersion)
        const db = request.result
        this.dbUpgrades({ db, oldVersion, newVersion, logger })
      }
    }

    request.onblocked = (event: IDBVersionChangeEvent) => {
      logger.log('upgrade blocked from version %d to %d', event.oldVersion, event.newVersion ?? DELETE_VERSION)
      state$.next('blocked')
    }

    request.onerror = () => {
      const error = request.error ?? new DOMException('unknown error')
      logger.error('open DB failed: %o', error)
      state$.error(error)
      logger.end()
    }

    request.onsuccess = () => {
      this.db = request.result
      this.db.onclose = () => {
        localStorage.setItem('dbClosed', Date.now().toString())
      }
      logger.log('open DB succeed')
      state$.next('open')
      state$.complete()
      logger.end()
    }

    return state$
  }

  /**
   * Close the DB and delete it.
   *
   * Emit 'blocked' if the delete the DB is blocked by another tab.
   * Emit 'deleted' if the DB is closed and deleted.
   */
  closeAndDeleteDB(): Observable<'blocked' | 'deleted'> {
    const state$ = new Subject<'blocked' | 'deleted'>()
    const logger = createLogger('closeAndDeleteDB')
    if (this.db) {
      logger.log('close DB')
      this.db.close()
      this.db = null
    }

    const request: IDBOpenDBRequest = this.idb.deleteDatabase(IDB_ID)
    request.onblocked = () => {
      logger.log('upgrade blocked to delete DB')
      state$.next('blocked')
    }

    request.onerror = () => {
      const error = request.error ?? new DOMException('unknown error')
      logger.error('delete DB failed: %o', error)
      state$.error(error)
      logger.end()
    }

    request.onsuccess = () => {
      this.db = request.result
      logger.log('delete DB succeed')
      state$.next('deleted')
      state$.complete()
      logger.end()
    }
    return state$
  }

  executeReadTransaction<T, StoreName extends SupportedStoreName>(
    storeNames: StoreName | StoreName[],
    callbacks: ReadCallbacks<T, StoreName>,
  ): Promise<[MetaRecord, T]> {
    return this.transaction(storeNames, 'readonly', async (tx) => {
      const rtx = new IdbReadTransaction<StoreName>(tx)
      const result = await callbacks.onTransaction(rtx)
      return [rtx.metaRecord, result]
    })
  }

  executeUpdateTransaction<StoreName extends SupportedStoreName>(
    storeNames: StoreName | StoreName[],
    callbacks: UpdateCallbacks<StoreName>,
  ): Promise<[MetaRecord]> {
    return this.transaction(storeNames, 'readwrite', async (tx) => {
      const utx = new IdbUpdateTransaction<StoreName>(tx)
      await callbacks.onTransaction(utx)
      callbacks.validatePreviousMeta(utx.beforeMetaRecord)
      return [utx.afterMetaRecord]
    })
  }

  private transaction<T>(
    storeNames: SupportedStoreName | SupportedStoreName[],
    mode: IDBTransactionMode,
    callback: IdbTransactionCallback<T>,
  ): Promise<T> {
    if (!this.db) {
      throw new Error('DB not open')
    }
    const logger = createLogger('transaction', mode)
    logger.log('store names: %o', storeNames)
    const tx = this.db.transaction(storeNames, mode)
    return new Promise<T>((resolve, reject) => {
      let result: T
      let abortError: unknown

      tx.onerror = () => {
        const error = tx.error ?? new DOMException('unknown error')
        logger.error('transaction failed: %o', error)
        logger.end()
        reject(error)
      }
      tx.onabort = () => {
        const error = abortError ?? new Error('transaction aborted')
        logger.error('transaction aborted: %o', error)
        logger.end()
        reject(error)
      }
      tx.oncomplete = () => {
        logger.log('transaction succeed: %o', result)
        logger.end()
        resolve(result)
      }
      callback(tx)
        .then((value) => {
          result = value
          tx.commit()
        })
        .catch((error) => {
          abortError = error
          tx.abort()
        })
    })
  }
}
