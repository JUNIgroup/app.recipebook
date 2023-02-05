/* eslint-disable max-classes-per-file */
import { AppThunk, Services } from '../../app.store'
import { actions, DBOpenState } from './db.slice'
import { StoreNames } from './idb.service'
import { AbortError, ObjectNotFound } from './db.errors'

export type { StoreNames } from './idb.service'

export function openDB(): AppThunk<void> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    dbService.openDB({
      onBlocked: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.UPGRADE_BLOCKED }))
      },
      onError: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.OPEN_FAILED }))
      },
      onOpen: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.OPEN }))
      },
    })
  }
}

export function closeAndDeleteDB(): AppThunk<void> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    dbService.closeAndDeleteDB({
      onBlocked: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.UPGRADE_BLOCKED }))
      },
      onError: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.OPEN_FAILED }))
      },
      onDelete: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.DELETED }))
      },
    })
  }
}

type Data = unknown & { id: string }

type DBObject = {
  changeIndex: number
  deleted?: true
  data: Data
}

const isDeleted = (object: DBObject) => object.deleted
const isNotDeleted = (object: DBObject) => !object.deleted

export interface ReadTransaction {
  getAll(storeName: StoreNames): Promise<Data[]>

  abort(message?: string): never
}

export interface UpdateTransaction extends ReadTransaction {
  add(storeName: StoreNames, data: Data): Promise<void>
  update(storeName: StoreNames, data: Data): Promise<void>
  delete(storeName: StoreNames, id: string): Promise<void>
}

class IdbReadTransaction implements ReadTransaction {
  constructor(protected tx: IDBTransaction) {}

  async getAll(storeName: StoreNames): Promise<Data[]> {
    const store = this.tx.objectStore(storeName)
    const objects: DBObject[] = await this.wrapRequest(store.getAll())
    return objects.filter(isNotDeleted).map((object) => object.data)
  }

  // eslint-disable-next-line class-methods-use-this
  abort(message?: string): never {
    throw new AbortError(message)
  }

  // eslint-disable-next-line class-methods-use-this
  protected wrapRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // eslint-disable-next-line class-methods-use-this
  protected checkAvailable(storeName: string, id: string, object: DBObject | undefined): asserts object is DBObject {
    if (object == null) throw new ObjectNotFound(storeName, id)
    if (isDeleted(object)) throw new ObjectNotFound(storeName, id)
  }
}

class IdbUpdateTransaction extends IdbReadTransaction implements UpdateTransaction {
  constructor(protected tx: IDBTransaction) {
    super(tx)
  }

  async add(storeName: StoreNames, data: Data): Promise<void> {
    const store = this.tx.objectStore(storeName)
    const object: DBObject = {
      changeIndex: 0,
      data,
    }
    await this.wrapRequest(store.add(object))
  }

  async update(storeName: StoreNames, data: Data): Promise<void> {
    const store = this.tx.objectStore(storeName)
    const object: DBObject | undefined = await this.wrapRequest(store.get(data.id))
    this.checkAvailable(storeName, data.id, object)

    object.changeIndex += 1
    object.data = data
    await this.wrapRequest(store.put(object))
  }

  async delete(storeName: StoreNames, id: string): Promise<void> {
    const store = this.tx.objectStore(storeName)
    const object: DBObject | undefined = await this.wrapRequest(store.get(id))
    this.checkAvailable(storeName, id, object)

    object.changeIndex += 1
    object.deleted = true
    object.data = { id }
    await this.wrapRequest(store.put(object))
  }
}

export function readFromDB<T>(
  storeNames: StoreNames | StoreNames[],
  callback: (tx: ReadTransaction) => Promise<T>,
): AppThunk<Promise<T>> {
  return async (_dispatch, _getState, services: Services) => {
    const { dbService } = services
    const result = await dbService.startReadTransaction(storeNames, (tx) => {
      const rtx: ReadTransaction = new IdbReadTransaction(tx)
      return callback(rtx)
    })
    return result
  }
}

export function updateInDB<T>(
  storeNames: StoreNames | StoreNames[],
  callback: (tx: UpdateTransaction) => Promise<T>,
): AppThunk<Promise<T>> {
  return async (_dispatch, _getState, services: Services) => {
    const { dbService } = services
    const result = await dbService.startUpdateTransaction(storeNames, (tx) => {
      const rtx: UpdateTransaction = new IdbUpdateTransaction(tx)
      return callback(rtx)
    })
    return result
  }
}
