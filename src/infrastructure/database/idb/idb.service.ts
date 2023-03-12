import { Observable, Subject } from 'rxjs'
import { IDB_ID } from '../../../app.constants'
import { Log, Logger } from '../../../utilities/logger'
import { MetaRecord, RdbService, ReadCallbacks, UpdateCallbacks } from '../rdb.service'
import { IdbReadTransaction, IdbUpdateTransaction } from './idb.transactions'

const DELETE_VERSION = -1

type IdbTransactionCallback<T> = (tx: IDBTransaction) => Promise<T>

export type IdbUpgrades = (args: { db: IDBDatabase; oldVersion: number; newVersion: number; log: Log }) => void

export class IdbService<SupportedStoreName extends string> implements RdbService<SupportedStoreName> {
  private log: Log

  private db: IDBDatabase | null = null

  constructor(
    private idb: IDBFactory,
    private dbId: string,
    private dbVersion: number,
    private dbUpgrades: IdbUpgrades,
    logger: Logger<'infra'>,
  ) {
    this.log = logger('infra:IdbService')
  }

  /**
   * Open the DB.
   *
   * Emit 'blocked' if the DB is blocked by another tab.
   * Emit 'open' if the DB is opened.
   *
   * Handle the upgrade of the DB if needed.
   */
  openDB(): Observable<'blocked' | 'open'> {
    this.log.info('openDB')
    const state$ = new Subject<'blocked' | 'open'>()
    const request: IDBOpenDBRequest = this.idb.open(this.dbId, this.dbVersion)

    request.onupgradeneeded = ({ oldVersion, newVersion }: IDBVersionChangeEvent) => {
      if (newVersion && oldVersion < newVersion) {
        this.log.info(`upgrade from version ${oldVersion} to ${newVersion}`)
        const db = request.result
        this.dbUpgrades({ db, oldVersion, newVersion, log: this.log })
      }
    }

    request.onblocked = (event: IDBVersionChangeEvent) => {
      this.log.warn(`upgrade blocked from version ${event.oldVersion} to ${event.newVersion ?? DELETE_VERSION}`)
      state$.next('blocked')
    }

    request.onerror = () => {
      const error = request.error ?? new DOMException('unknown error')
      this.log.error('open DB failed:', error)
      state$.error(error)
    }

    request.onsuccess = () => {
      this.db = request.result
      this.db.onclose = () => {
        localStorage.setItem('dbClosed', Date.now().toString())
      }
      this.log.details('open DB succeed')
      state$.next('open')
      state$.complete()
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
    this.log.info('closeAndDeleteDB')
    const state$ = new Subject<'blocked' | 'deleted'>()
    if (this.db) {
      this.log.details('close DB')
      this.db.close()
      this.db = null
    }

    const request: IDBOpenDBRequest = this.idb.deleteDatabase(IDB_ID)
    request.onblocked = () => {
      this.log.warn('upgrade blocked to delete DB')
      state$.next('blocked')
    }

    request.onerror = () => {
      const error = request.error ?? new DOMException('unknown error')
      this.log.error('delete DB failed:', error)
      state$.error(error)
    }

    request.onsuccess = () => {
      this.db = request.result
      this.log.details('delete DB succeed')
      state$.next('deleted')
      state$.complete()
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
    this.log.info(`execute ${mode} transaction`)
    this.log.details('store names:', storeNames)
    const tx = this.db.transaction(storeNames, mode)
    this.log.details('transaction created')
    return new Promise<T>((resolve, reject) => {
      let result: T
      let abortError: unknown

      tx.onerror = () => {
        const error = tx.error ?? new DOMException('unknown error')
        this.log.error('transaction failed:', error)
        reject(error)
      }
      tx.onabort = () => {
        const error = abortError ?? new Error('transaction aborted')
        this.log.error('transaction aborted:', error)
        reject(error)
      }
      tx.oncomplete = () => {
        this.log.details('transaction succeed', result)
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
