import {
  MetaRecord,
  RdbData,
  RdbDeleteCallbacks,
  RdbMeta,
  RdbOpenCallbacks,
  RdbService,
  ReadCallbacks,
  UpdateCallbacks,
} from '../rdb.service'
import { MockReadTransaction, MockUpdateTransaction, nonNull, Store } from './mock-rdb.transitions'

export class MockRdbService<SupportedStoreName extends string = string> implements RdbService<SupportedStoreName> {
  public openDelay?: () => Promise<void>

  public deleteDelay?: () => Promise<void>

  private $db: Record<string, Store> | undefined = undefined

  private lock: Promise<unknown> = Promise.resolve()

  /** set a doc for the mock, ignoring the transitions  */
  setDoc(storeName: string, data: RdbData, meta: RdbMeta): void {
    const store = this.db[storeName] ?? {}
    store[data.id] = { data, meta }
    this.db[storeName] = store
  }

  /** get a store of the mock, ignoring the transitions  */
  getStore(storeName: string): Store {
    return this.db[storeName] ?? {}
  }

  openDB(callbacks: RdbOpenCallbacks): void {
    if (this.$db) {
      callbacks.onError(new Error('DB already opened'))
      return
    }
    const delay = this.openDelay ?? (() => Promise.resolve())

    callbacks.onBlocked()
    delay()
      .then(() => {
        this.$db = {}
        callbacks.onOpen()
      })
      .catch(callbacks.onError)
  }

  /**
   * Close the remote DB and delete it.
   * Call the callbacks when the DB is deleted, blocked or an error occurs.
   *
   * @param callbacks callbacks to call when the DB is deleted, blocked or an error occurs.
   */
  closeAndDeleteDB(callbacks: RdbDeleteCallbacks): void {
    const delay = this.deleteDelay ?? Promise.resolve

    callbacks.onBlocked()
    this.lock
      .then(delay)
      .then(() => {
        this.$db = undefined
        this.lock = Promise.resolve()
        callbacks.onDelete()
      })
      .catch(callbacks.onError)
  }

  /**
   * Execute a read (only) transaction on the remote DB.
   *
   * @param storeNames one or more store names, which are allowed to access while reading
   * @param onReadTransaction the operations to execute in the read transaction
   */
  async executeReadTransaction<T, StoreName extends SupportedStoreName>(
    storeNames: StoreName | StoreName[],
    callbacks: ReadCallbacks<T, StoreName>,
  ): Promise<[MetaRecord, T]> {
    const storeNameArray = typeof storeNames === 'string' ? [storeNames] : storeNames
    const lock = this.criticalSections<[MetaRecord, T]>(async () => {
      const stores = this.copyStores(storeNameArray)
      const rtx = new MockReadTransaction<StoreName>(stores)
      const result = await callbacks.onTransaction(rtx)
      this.commitStores(stores)
      return [rtx.metaRecord, result]
    })
    this.lock = lock
    return lock
  }

  /**
   * Execute an update (check and write) transaction on the remote DB.
   *
   * @param storeNames one or more store names, which are allowed to access while updating
   * @param onReadTransaction the operations to execute in the update transaction
   */
  async executeUpdateTransaction<StoreName extends SupportedStoreName>(
    storeNames: StoreName | StoreName[],
    callbacks: UpdateCallbacks<StoreName>,
  ): Promise<[MetaRecord]> {
    const storeNameArray = typeof storeNames === 'string' ? [storeNames] : storeNames
    const lock = this.criticalSections<[MetaRecord]>(async () => {
      const stores = this.copyStores(storeNameArray)
      const utx = new MockUpdateTransaction<StoreName>(stores)
      await callbacks.onTransaction(utx)
      callbacks.validatePreviousMeta(utx.beforeMetaRecord)
      this.commitStores(stores)
      return [utx.afterMetaRecord]
    })
    this.lock = lock
    return lock
  }

  private get db(): Record<string, Store> {
    return nonNull(this.$db, 'DB not opened')
  }

  private async criticalSections<T>(callback: () => Promise<T>): Promise<T> {
    await this.lock
    try {
      return await callback()
    } finally {
      this.lock = Promise.resolve()
    }
  }

  /** starts a critical section for each store and creates after enter the critical store a temporary copy */
  private copyStores(storeNames: string[]): Record<string, Store> {
    const stores: Record<string, Store> = {}
    storeNames.forEach((storeName) => {
      stores[storeName] = this.db[storeName] || {}
    })
    return stores
  }

  private async commitStores(stores: Record<string, Store>) {
    Object.entries(stores).forEach(([storeName, store]) => {
      this.db[storeName] = store
    })
  }
}
