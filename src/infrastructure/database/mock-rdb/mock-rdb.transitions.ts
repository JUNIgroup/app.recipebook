/* eslint-disable max-classes-per-file */

import { AbortError } from '../abort-error'
import { MetaRecord, RdbData, RdbMeta, ReadTransaction, UpdateTransaction } from '../rdb.service'

export type Doc = { meta: RdbMeta; data: RdbData }
export type Store = Record<string, Doc>

export function nonNull<T>(value: T | undefined | null, message: string): T {
  if (value != null) return value
  throw new Error(message)
}

const REMOTE_NOT_FOUND = Object.freeze({ changeIndex: NaN, deleted: true })

export class MockReadTransaction<StoreName extends string> implements ReadTransaction<StoreName> {
  readonly metaRecord: MetaRecord = {}

  constructor(public readonly stores: Record<string, Store>) {}

  // eslint-disable-next-line class-methods-use-this
  public abort(message?: string): never {
    throw new AbortError(message)
  }

  public async getAll(storeName: StoreName) {
    const store = this.getStore(storeName)
    return Object.keys(store)
      .map((id) => this.read(store, id))
      .filter((doc) => !store[doc.id].meta.deleted)
  }

  public async get(storeName: StoreName, id: string) {
    const store = this.getStore(storeName)
    return this.read(store, id)
  }

  private getStore(storeName: StoreName) {
    return nonNull(this.stores[storeName], `Store ${storeName} not allowed`)
  }

  private read(store: Store, id: string) {
    const doc = store[id]
    this.metaRecord[id] = doc?.meta ?? REMOTE_NOT_FOUND
    return doc?.data ?? null
  }
}

export class MockUpdateTransaction<StoreName extends string> implements UpdateTransaction<StoreName> {
  /** Metadata before apply update */
  readonly beforeMetaRecord: MetaRecord = {}

  /** Metadata after apply update */
  readonly afterMetaRecord: MetaRecord = {}

  constructor(public readonly stores: Record<string, Store>) {}

  // eslint-disable-next-line class-methods-use-this
  public abort(message?: string): never {
    throw new AbortError(message)
  }

  async add(storeName: StoreName, data: { id: string }): Promise<void> {
    const { id } = data
    const store = this.stores[storeName] ?? {}
    const beforeMeta = REMOTE_NOT_FOUND
    const afterMeta = { changeIndex: 0 }
    store[id] = { meta: afterMeta, data }
    this.beforeMetaRecord[id] = beforeMeta
    this.afterMetaRecord[id] = afterMeta
    this.stores[storeName] = store
  }

  async update(storeName: StoreName, data: { id: string }): Promise<void> {
    const { id } = data
    const store = this.stores[storeName] ?? {}
    const beforeMeta = this.fetchBeforeMeta(store, id)
    const afterMeta: RdbMeta = { changeIndex: this.incChangeVersion(id) }
    store[id] = { meta: afterMeta, data }
    this.beforeMetaRecord[id] = beforeMeta
    this.afterMetaRecord[id] = afterMeta
    this.stores[storeName] = store
  }

  async delete(storeName: StoreName, id: string): Promise<void> {
    const store = this.stores[storeName] ?? {}
    const beforeMeta = this.fetchBeforeMeta(store, id)
    if (beforeMeta.deleted) {
      this.beforeMetaRecord[id] = beforeMeta
      this.afterMetaRecord[id] = beforeMeta
      return
    }

    const afterMeta: RdbMeta = { changeIndex: this.incChangeVersion(id), deleted: true }
    store[id] = { meta: afterMeta, data: { id } }
    this.beforeMetaRecord[id] = beforeMeta
    this.afterMetaRecord[id] = afterMeta
  }

  private fetchBeforeMeta(store: Store, id: string): RdbMeta {
    let meta = this.beforeMetaRecord[id]
    if (meta) return meta

    const fetched = store[id]
    meta = fetched == null ? REMOTE_NOT_FOUND : fetched.meta
    this.beforeMetaRecord[id] = meta
    return meta
  }

  private incChangeVersion(id: string): number {
    const meta = this.afterMetaRecord[id] ?? this.beforeMetaRecord[id]
    if (Number.isNaN(meta.changeIndex)) return 0
    return meta.changeIndex + 1
  }
}
