import { Observable, map, tap } from 'rxjs'
import { encodeTime } from 'ulid'
import { Log, Logger } from '../../../../utilities/logger'
import { CollectionPath, Database, Result } from '../database'
import { EpochTimestamp, FirestoreService } from './firestore-service.api'
import { Doc } from '../database-types'

/**
 * Using the REST API for Firestore, implement the Database interface.
 */
export class FirestoreDatabase implements Database {
  private log: Log

  constructor(logger: Logger<'business'>, private readonly firestoreService: FirestoreService) {
    this.log = logger('business:FirestoreDatabase')
  }

  getDocs(path: CollectionPath, after?: EpochTimestamp): Observable<Array<Result<Doc>>> {
    const time0 = Date.now()
    const operation = encodeTime(time0, 10)
    this.log.info(`${operation} getDocs of ${asLogPath(path)}${after ? ` after ${new Date(after)}` : ''}`)

    const parentPath = asParentPath(path)
    return this.firestoreService.readDocs(parentPath, after).pipe(
      map((readDocs) => readDocs as Array<Result<Doc>>),
      tap({
        next: (results) => this.log.details(`${operation}`, results),
        complete: () => this.log.details(`${operation} took ${(Date.now() - time0) / 1000}ms`),
      }),
    )
  }

  async putDoc(path: CollectionPath, doc: Doc): Promise<Result<Doc>> {
    const time0 = Date.now()
    const operation = encodeTime(time0, 10)
    this.log.info(`${operation} put doc into ${asLogPath(path)}:`, doc)

    const docPath = asDocPath(path, doc.id)
    await this.firestoreService.writeDoc(docPath, doc)
    const written = await this.firestoreService.readDoc(docPath)
    this.log.details(`${operation} written:`, written)
    this.log.details(`${operation} took ${(Date.now() - time0) / 1000}ms`)
    return written as Result<Doc>
  }

  async delDoc(path: CollectionPath, doc: Doc): Promise<void> {
    const time0 = Date.now()
    const operation = encodeTime(time0, 10)
    this.log.info(`${operation} delete doc from ${asLogPath(path)}: ${doc.id}`)

    const docPath = asDocPath(path, doc.id)
    await this.firestoreService.delDoc(docPath)
    this.log.details(`${operation} took ${(Date.now() - time0) / 1000}ms`)
  }
}

function asLogPath(path: CollectionPath): string {
  return 'collection' in path ? `${path.bucket}/${path.bucketId}/${path.collection}` : path.bucket
}

function asParentPath(path: CollectionPath): string[] {
  return 'collection' in path ? [path.bucket, path.bucketId, path.collection] : [path.bucket]
}

function asDocPath(path: CollectionPath, docId: string): string[] {
  return 'collection' in path ? [path.bucket, path.bucketId, path.collection, docId] : [path.bucket, docId]
}
