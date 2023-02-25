import { IDB_ID } from '../../../app.constants'
import {
  MetaRecord,
  RdbDeleteCallbacks,
  RdbOpenCallbacks,
  RdbService,
  ReadCallbacks,
  UpdateCallbacks,
} from '../rdb.service'
import { Logger, ServiceLogger } from '../../logger/logger'
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
   * Call the callbacks when the DB is opened, blocked or an error occurs.
   *
   * Handle the upgrade of the DB if needed.
   *
   * @param callbacks callbacks to call when the DB is opened, blocked or an error occurs.
   */
  openDB(callbacks: RdbOpenCallbacks) {
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
      callbacks.onBlocked()
    }

    request.onerror = () => {
      const error = request.error ?? new DOMException('unknown error')
      logger.error('open DB failed: %o', error)
      callbacks.onError(error)
      logger.end()
    }

    request.onsuccess = () => {
      this.db = request.result
      this.db.onclose = () => {
        localStorage.setItem('dbClosed', Date.now().toString())
      }
      logger.log('open DB succeed')
      callbacks.onOpen()
      logger.end()
    }
  }

  /**
   * Close the DB and delete it.
   * Call the callbacks when the DB is deleted, blocked or an error occurs.
   *
   * @param callbacks callbacks to call when the DB is deleted, blocked or an error occurs.
   */
  closeAndDeleteDB(callbacks: RdbDeleteCallbacks) {
    const logger = createLogger('closeAndDeleteDB')
    if (this.db) {
      logger.log('close DB')
      this.db.close()
      this.db = null
    }

    const request: IDBOpenDBRequest = this.idb.deleteDatabase(IDB_ID)
    request.onblocked = () => {
      logger.log('upgrade blocked to delete DB')
      callbacks.onBlocked()
    }

    request.onerror = () => {
      const error = request.error ?? new DOMException('unknown error')
      logger.error('delete DB failed: %o', error)
      callbacks.onError(error)
      logger.end()
    }

    request.onsuccess = () => {
      this.db = request.result
      logger.log('delete DB succeed')
      callbacks.onDelete()
      logger.end()
    }
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
