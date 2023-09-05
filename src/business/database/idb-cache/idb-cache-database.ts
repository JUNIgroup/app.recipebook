import { Observable, concat, from, map, mergeMap, switchMap, tap } from 'rxjs'
import { Log, Logger } from '../../../utilities/logger'
import { CollectionPath, Database, OperationCode, Result } from '../database'
import { Doc } from '../database-types'
import { IDBStorage, clearCache, createKeyRange, openIdb, readIndex, write, writeAll } from './utils'

type IdbCacheOptions = {
  /**
   * The indexedDB factory.
   *
   * This is useful for testing outside of a browser.
   *
   * @default globalThis.indexedDB
   */
  indexedDB?: IDBFactory

  /**
   * The name of the IDB store to use for the cache.
   */
  cacheName: string

  /**
   * The name of the IDB store to use for the cache.
   *
   * @default 'cache'
   */
  storeName?: string

  /**
   * The name of the IDB index to use for the cache.
   *
   * @default 'lastUpdate'
   */
  indexName?: string

  /**
   * If true, the cache will be cleared directly after the database is opened.
   *
   * This is useful for development and testing.
   */
  clearOnStart?: boolean
}

/**
 * A database, that caches the documents, that are read from or written to the database.
 */
export class IdbCacheDatabase implements Database {
  private readonly log: Log
  private storage: Promise<IDBStorage>

  /**
   * Creates a new database, that caches the documents, that are read from or written to the database.
   *
   * @param logger the logger to use
   * @param database the inner database, that should be cached
   * @param cacheName the name of the IDB store to use for the cache
   */
  constructor(
    logger: Logger<'business'>,
    private readonly database: Database,
    private options: IdbCacheOptions,
  ) {
    this.log = logger('business:IdbCacheDatabase')
    this.storage = this.openStorage()
  }

  getDocs(operationCode: OperationCode, path: CollectionPath, after?: number | undefined): Observable<Result<Doc>[]> {
    return from(this.storage).pipe(
      switchMap((storage) =>
        concat(
          this.getCachedDocs(storage, operationCode, path, after), //
          this.getRemoteDocs(storage, operationCode, path, after),
        ),
      ),
    )
  }

  private getCachedDocs(
    storage: IDBStorage,
    operationCode: OperationCode,
    path: CollectionPath,
    after?: number | undefined,
  ): Observable<Result<Doc>[]> {
    const parent = this.getParent(path)
    this.log.details(`${operationCode} getDocs (cache): ${parent}/*`)

    const keyRange = createKeyRange(parent, after)
    return readIndex(storage, keyRange).pipe(
      map((entities) => entities.map(({ lastUpdate, doc }) => ({ lastUpdate, doc }))),
      tap((results) => this.log.details(`${operationCode} (cache): `, results)),
    )
  }

  private getRemoteDocs(storage: IDBStorage, operationCode: string, path: CollectionPath, after?: number | undefined) {
    const parent = this.getParent(path)
    const cacheResults = async (results: Result<Doc>[]) => {
      const entities = results.map((result) => ({ ...result, parent }))
      this.log.details(`${operationCode} (remote): `, results)
      await writeAll(storage, entities)
      return results
    }

    this.log.details(`${operationCode} getDocs (remote): ${parent}/*`)
    return this.database.getDocs(operationCode, path, after).pipe(mergeMap((results) => from(cacheResults(results))))
  }

  async putDoc(operationCode: OperationCode, path: CollectionPath, doc: Doc): Promise<Result<Doc>> {
    const parent = this.getParent(path)
    this.log.details(`Writing document to cache: ${parent}/${doc.id}`)

    const result = await this.database.putDoc(operationCode, path, doc)

    const storage = await this.storage
    await write(storage, { ...result, parent })

    return result
  }

  // eslint-disable-next-line class-methods-use-this
  private getParent(path: CollectionPath): string {
    return 'collection' in path //
      ? `${path.bucket}/${path.bucketId}/${path.collection}`
      : `${path.bucket}`
  }

  private async openStorage(): Promise<IDBStorage> {
    const indexedDB = this.options.indexedDB ?? globalThis.indexedDB
    const idbName = this.options.cacheName
    const storeName = this.options.storeName ?? 'cache'
    const indexName = this.options.indexName ?? 'lastUpdate'
    try {
      this.log.info(`Opening IDB cache '${idbName}/${storeName}'`)
      const storage = await openIdb(indexedDB, idbName, storeName, indexName)
      if (this.options.clearOnStart) {
        this.log.details(`Clearing IDB cache`)
        await clearCache(storage)
      }
      return storage
    } catch (error) {
      this.log.error(`Failed to open IDB database '${idbName}'`, error)
      throw error
    }
  }
}
