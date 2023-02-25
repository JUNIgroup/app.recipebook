/* eslint-disable max-classes-per-file */

import { AbortError } from '../abort-error'
import { ID, MetaRecord, RdbData, RdbMeta, ReadTransaction, UpdateTransaction } from '../rdb.service'

export type DBObject = RdbMeta & {
  data: RdbData
}

export function wrapRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const REMOTE_NOT_FOUND = Object.freeze({ changeIndex: NaN, deleted: true })

export class IdbReadTransaction<StoreName extends string> implements ReadTransaction<StoreName> {
  readonly metaRecord: MetaRecord = {}

  constructor(private tx: IDBTransaction) {}

  // eslint-disable-next-line class-methods-use-this
  abort(message?: string): never {
    throw new AbortError(message)
  }

  async getAll(storeName: StoreName): Promise<RdbData[]> {
    const store = this.tx.objectStore(storeName)
    const objects: DBObject[] = await wrapRequest(store.getAll())
    const allData: RdbData[] = []
    objects.forEach(({ data, ...meta }) => {
      this.metaRecord[data.id] = meta
      if (!meta.deleted) allData.push(data)
    })
    return allData
  }

  async get(storeName: StoreName, id: ID): Promise<RdbData | null> {
    const store = this.tx.objectStore(storeName)
    const object: DBObject = await wrapRequest(store.get(id))
    if (object == null) {
      this.metaRecord[id] = { changeIndex: Number.NaN, deleted: true }
      return null
    }
    if (object.deleted) {
      this.metaRecord[id] = { changeIndex: object.changeIndex, deleted: true }
      return null
    }
    this.metaRecord[id] = { changeIndex: object.changeIndex }
    return object.data
  }
}

export class IdbUpdateTransaction<StoreName extends string> implements UpdateTransaction<StoreName> {
  /** Metadata before apply update */
  public readonly beforeMetaRecord: MetaRecord = {}

  /** Metadata after apply update */
  public readonly afterMetaRecord: MetaRecord = {}

  constructor(private tx: IDBTransaction) {}

  // eslint-disable-next-line class-methods-use-this
  abort(message?: string): never {
    throw new AbortError(message)
  }

  async add<D extends RdbData>(storeName: StoreName, data: D): Promise<void> {
    const { id } = data
    const store = this.tx.objectStore(storeName)
    const beforeMeta = REMOTE_NOT_FOUND
    const afterMeta = { changeIndex: 0 }
    await wrapRequest(store.add({ ...afterMeta, data }))
    this.beforeMetaRecord[id] = beforeMeta
    this.afterMetaRecord[id] = afterMeta
  }

  async update<D extends RdbData>(storeName: StoreName, data: D): Promise<void> {
    const { id } = data
    const store = this.tx.objectStore(storeName)
    const beforeMeta = await this.fetchBeforeMeta(store, id)
    const afterMeta: RdbMeta = { changeIndex: this.incChangeVersion(id) }
    await wrapRequest(store.put({ ...afterMeta, data }))
    this.beforeMetaRecord[id] = beforeMeta
    this.afterMetaRecord[id] = afterMeta
  }

  async delete(storeName: StoreName, id: string): Promise<void> {
    const store = this.tx.objectStore(storeName)
    const beforeMeta = await this.fetchBeforeMeta(store, id)
    if (beforeMeta.deleted) {
      this.afterMetaRecord[id] = beforeMeta
      return
    }

    const afterMeta: RdbMeta = { changeIndex: this.incChangeVersion(id), deleted: true }
    await wrapRequest(store.put({ ...afterMeta, data: { id } }))
    this.beforeMetaRecord[id] = beforeMeta
    this.afterMetaRecord[id] = afterMeta
  }

  private async fetchBeforeMeta(store: IDBObjectStore, id: string): Promise<RdbMeta> {
    let meta = this.beforeMetaRecord[id]
    if (meta) return meta

    const fetched: DBObject | undefined = await wrapRequest(store.get(id))
    if (fetched == null) {
      meta = REMOTE_NOT_FOUND
      this.beforeMetaRecord[id] = meta
      return meta
    }

    if (fetched.deleted) {
      meta = { changeIndex: fetched.changeIndex, deleted: true }
      this.beforeMetaRecord[id] = meta
      return meta
    }

    meta = { changeIndex: fetched.changeIndex }
    this.beforeMetaRecord[id] = meta
    return meta
  }

  private incChangeVersion(id: string): number {
    const meta = this.afterMetaRecord[id] ?? this.beforeMetaRecord[id]
    if (Number.isNaN(meta.changeIndex)) return 0
    return meta.changeIndex + 1
  }
}
