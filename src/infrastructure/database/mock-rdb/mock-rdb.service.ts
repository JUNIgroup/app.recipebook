import { concat, EMPTY, from, ignoreElements, Observable, of, tap, throwError } from 'rxjs'
import { MetaRecord, RdbData, RdbMeta, RdbService, ReadCallbacks, UpdateCallbacks } from '../rdb.service'
import { MockReadTransaction, MockUpdateTransaction, nonNull, Store } from './mock-rdb.transitions'

export class MockRdbService<SupportedStoreName extends string = string> implements RdbService<SupportedStoreName> {
  public openDelay?: () => Observable<unknown>

  public deleteDelay?: () => Observable<unknown>

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

  /**
   * Open the remote DB.
   *
   * Emits 'blocked' if the DB is blocked by an open transaction.
   * Emits 'open' when the DB is open.
   */
  openDB(): Observable<'blocked' | 'open'> {
    if (this.$db) {
      return throwError(() => new Error('DB already opened'))
    }

    const delay$: Observable<'blocked'> = this.openDelay
      ? concat(this.openDelay().pipe(ignoreElements()), of<'blocked'>('blocked')) // blocking
      : EMPTY // non-blocking

    const open$ = of<'open'>('open').pipe(
      tap(() => {
        this.$db = {}
      }),
    )

    return concat(delay$, open$)
  }

  /**
   * Close the remote DB and delete it.
   *
   * Emits 'blocked' if the DB is blocked by an open transaction.
   * Emits 'deleted' when the DB was closed and deleted.
   */
  closeAndDeleteDB(): Observable<'blocked' | 'deleted'> {
    const unlocked$ = from(this.lock).pipe(ignoreElements())
    this.$db = undefined
    this.lock = Promise.resolve()

    const delay$: Observable<'blocked'> = this.deleteDelay
      ? concat(this.deleteDelay().pipe(ignoreElements()), of<'blocked'>('blocked')) // blocking
      : EMPTY // non-blocking

    const delete$ = of<'deleted'>('deleted')

    return concat(unlocked$, delay$, delete$)
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
