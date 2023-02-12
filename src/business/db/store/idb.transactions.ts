/* eslint-disable max-classes-per-file */

import { AbortError } from './db.errors'
import { DBObjectMetaData, DBObjectState, OutdatedCause } from './db.types'

type ID = string
type StoreName = string

export type Data = unknown & { id: ID }

export type DBObjectMeta = {
  changeIndex: number
  deleted?: true
}

export type DBObject = DBObjectMeta & {
  data: Data
}

export interface ReadTransaction {
  abort(message?: string): never
  getAll(storeName: string): Promise<Data[]>
  get(storeName: string, id: string): Promise<Data | null>
}

export interface UpdateTransaction {
  abort(message?: string): never
  add(storeName: StoreName, data: Data): Promise<void>
  update(storeName: StoreName, data: Data): Promise<void>
  delete(storeName: StoreName, id: ID): Promise<void>
}

export function wrapRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function inc(changeIndex: number): number {
  return Number.isNaN(changeIndex) ? 0 : changeIndex + 1
}

export type ReadMetaRecord = Record<ID, DBObjectMeta>

export class IdbReadTransaction implements ReadTransaction {
  constructor(private tx: IDBTransaction, private metaRecord: ReadMetaRecord) {}

  // eslint-disable-next-line class-methods-use-this
  abort(message?: string): never {
    throw new AbortError(message)
  }

  async getAll(storeName: StoreName): Promise<Data[]> {
    const store = this.tx.objectStore(storeName)
    const objects: DBObject[] = await wrapRequest(store.getAll())
    const allData: Data[] = []
    objects.forEach(({ data, ...meta }) => {
      this.metaRecord[data.id] = meta
      if (!meta.deleted) allData.push(data)
    })
    return allData
  }

  async get(storeName: StoreName, id: ID): Promise<Data | null> {
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

type DBObjectUpdate = {
  before: DBObject | undefined
  after: DBObject
}

export type UpdateMetaRecord = Record<ID, DBObjectUpdate>

export interface History {
  storeName: StoreName
  fetched?: DBObject
  written?: DBObject
}

export class Histories {
  private readonly histories: Record<string, History> = {}

  applyFetched(storeName: StoreName, fetched: DBObject): void {
    const { id } = fetched.data
    const update = this.histories[id] ?? { storeName }
    this.histories[id] = { ...update, fetched }
  }

  applyWritten(storeName: StoreName, written: DBObject): void {
    const { id } = written.data
    const update = this.histories[id] ?? { storeName }
    this.histories[id] = { ...update, written }
  }

  getLatest(id: string): DBObject | undefined {
    const history = this.histories[id]
    if (history == null) return undefined
    return history.written ?? history.fetched
  }
}

export class IdbUpdateTransaction implements UpdateTransaction {
  constructor(private tx: IDBTransaction, private metaRecord: UpdateMetaRecord) {}

  // eslint-disable-next-line class-methods-use-this
  abort(message?: string): never {
    throw new AbortError(message)
  }

  async add<D extends Data>(storeName: StoreName, data: D): Promise<void> {
    const store = this.tx.objectStore(storeName)
    const after: DBObject = {
      changeIndex: 0,
      data,
    }
    await wrapRequest(store.add(after))
    this.metaRecord[data.id] = { before: undefined, after }
  }

  async update<D extends Data>(storeName: StoreName, data: D): Promise<void> {
    const [store, before] = await this.getBeforeObject(storeName, data.id)
    const after: DBObject = {
      ...before,
      changeIndex: inc(before.changeIndex),
      data,
    }
    delete after.deleted
    await wrapRequest(store.put(after))
    this.metaRecord[data.id] = { before, after }
  }

  async delete(storeName: StoreName, id: string): Promise<void> {
    const [store, before] = await this.getBeforeObject(storeName, id)
    if (before.deleted) {
      this.metaRecord[id] = { before, after: before }
      return
    }
    const after: DBObject = {
      ...before,
      changeIndex: inc(before.changeIndex),
      deleted: true,
      data: { id },
    }
    await wrapRequest(store.put(after))
    this.metaRecord[id] = { before, after }
  }

  private async getBeforeObject(storeName: StoreName, id: string): Promise<[IDBObjectStore, DBObject]> {
    const store = this.tx.objectStore(storeName)
    const meta = this.metaRecord[id] ?? {}
    if (meta.before) return [store, meta.before]

    const fetched: DBObject | undefined = await wrapRequest(store.get(id))
    if (fetched == null) {
      return [store, { changeIndex: Number.NaN, deleted: true, data: { id } }]
    }
    if (fetched.deleted) {
      return [store, { changeIndex: fetched.changeIndex, deleted: true, data: { id } }]
    }
    return [store, fetched]
  }
}

export function convertReadMetaRecordToMetaData(metaRecord: ReadMetaRecord): DBObjectMetaData[] {
  const metaData: DBObjectMetaData[] = Object.entries(metaRecord).map(([id, meta]) => ({
    id,
    changeIndex: meta.changeIndex,
    state: meta.deleted ? DBObjectState.DELETED : DBObjectState.CACHED,
  }))
  return metaData
}

export function convertUpdateMetaRecordToMetaData(metaRecord: UpdateMetaRecord): DBObjectMetaData[] {
  const metaData: DBObjectMetaData[] = Object.entries(metaRecord).map(([id, { after }]) => ({
    id,
    changeIndex: after.changeIndex,
    state: after.deleted ? DBObjectState.DELETED : DBObjectState.CACHED,
  }))
  return metaData
}

export function validateUpdateMetaRecord(
  metaRecord: UpdateMetaRecord,
  initialMetaData: Record<string, DBObjectMetaData>,
): null | Record<string, OutdatedCause> {
  function validate(local: DBObjectMetaData | undefined, remote: DBObject | undefined): OutdatedCause | null {
    if (local === undefined && remote === undefined) return null
    if (local === undefined) return OutdatedCause.LOCAL_NOT_FOUND
    if (remote === undefined) return OutdatedCause.REMOTE_NOT_FOUND
    if (local.changeIndex === remote.changeIndex) return null
    return remote.deleted ? OutdatedCause.REMOTE_DELETED : OutdatedCause.REMOTE_MODIFIED
  }

  let outdated = false
  const outdatedObjects: Record<string, OutdatedCause> = {}
  Object.entries(metaRecord).forEach(([id, { before }]) => {
    const cause = validate(initialMetaData[id], before)
    if (cause != null) {
      outdated = true
      outdatedObjects[id] = cause
    }
  })
  return outdated ? outdatedObjects : null
}
