import { IDB_ID } from '../../../app.constants'
import { ServiceLogger } from '../../logger/logger'

const serviceName = 'IdbService'

const createLogger = ServiceLogger(serviceName)

const DELETE_VERSION = -1

const dbUpgrades: ((db: IDBDatabase) => void)[] = [
  // version 0 ==> 1
  (db) => {
    db.createObjectStore('recipes', { keyPath: 'data.id' })
  },
]

interface IdbOpenCallbacks {
  onBlocked: (event: IDBVersionChangeEvent) => void
  onError: (error: DOMException) => void
  onOpen: () => void
}

interface IdbDeleteCallbacks {
  onBlocked: (event: IDBVersionChangeEvent) => void
  onError: (error: DOMException) => void
  onDelete: () => void
}

export type StoreNames = 'recipes'

export type IdbUpdateCallback<T> = (tx: IDBTransaction) => Promise<T>
export type IdbReadCallback<T> = (tx: IDBTransaction) => Promise<T>

export class IdbService {
  private db: IDBDatabase | null = null

  constructor(private idb: IDBFactory) {}

  /**
   * Open the DB.
   * Call the callbacks when the DB is opened, blocked or an error occurs.
   *
   * Handle the upgrade of the DB if needed.
   *
   * @param callbacks callbacks to call when the DB is opened, blocked or an error occurs.
   */
  openDB(callbacks: IdbOpenCallbacks) {
    const logger = createLogger('openDB')
    const request: IDBOpenDBRequest = this.idb.open(IDB_ID, dbUpgrades.length)

    request.onupgradeneeded = ({ oldVersion, newVersion }: IDBVersionChangeEvent) => {
      if (newVersion && oldVersion < newVersion) {
        logger.log('upgrade from version %d to %d', oldVersion, newVersion)
        const db = request.result
        for (let version = oldVersion; version < newVersion; version += 1) {
          dbUpgrades[version](db)
        }
      }
    }

    request.onblocked = (event: IDBVersionChangeEvent) => {
      logger.log('upgrade blocked from version %d to %d', event.oldVersion, event.newVersion ?? DELETE_VERSION)
      callbacks.onBlocked(event)
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
  closeAndDeleteDB(callbacks: IdbDeleteCallbacks) {
    const logger = createLogger('closeAndDeleteDB')
    if (this.db) {
      logger.log('close DB')
      this.db.close()
      this.db = null
    }

    const request: IDBOpenDBRequest = this.idb.deleteDatabase(IDB_ID)
    request.onblocked = (event: IDBVersionChangeEvent) => {
      logger.log('upgrade blocked to delete DB')
      callbacks.onBlocked(event)
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

  startUpdateTransaction<T>(storeNames: StoreNames | StoreNames[], callback: IdbUpdateCallback<T>): Promise<T> {
    return this.transaction(storeNames, 'readwrite', callback)
  }

  startReadTransaction<T>(storeNames: StoreNames | StoreNames[], callback: IdbReadCallback<T>): Promise<T> {
    return this.transaction(storeNames, 'readonly', callback)
  }

  private transaction<T>(
    storeNames: StoreNames | StoreNames[],
    mode: IDBTransactionMode,
    callback: IdbUpdateCallback<T>,
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
