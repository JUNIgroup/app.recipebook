import { Observable, map, tap } from 'rxjs'
import { Log, Logger } from '../../../../utilities/logger'
import { CollectionPath, Database, OperationCode, Result } from '../database'
import { Doc } from '../database-types'
import { EpochTimestamp, FirestoreService } from './firestore-service.api'

/**
 * Using the REST API for Firestore, implement the Database interface.
 */
export class FirestoreDatabase implements Database {
  private log: Log

  constructor(logger: Logger<'business'>, private readonly firestoreService: FirestoreService) {
    this.log = logger('business:FirestoreDatabase')
  }

  getDocs(operationCode: OperationCode, path: CollectionPath, after?: EpochTimestamp): Observable<Array<Result<Doc>>> {
    this.log.info(`${operationCode} getDocs of ${asLogPath(path)}${after ? ` after ${new Date(after)}` : ''}`)

    const time0 = Date.now()
    const parentPath = asParentPath(path)
    return this.firestoreService.readDocs(operationCode, parentPath, after).pipe(
      map((readDocs) => readDocs as Array<Result<Doc>>),
      tap({
        next: (results) => this.log.details(`${operationCode}`, results),
        complete: () => this.log.details(`${operationCode} took ${(Date.now() - time0) / 1000}ms`),
      }),
    )
  }

  async putDoc(operationCode: OperationCode, path: CollectionPath, doc: Doc): Promise<Result<Doc>> {
    this.log.info(`${operationCode} put doc into ${asLogPath(path)}:`, doc)

    const time0 = Date.now()
    const docPath = asDocPath(path, doc.id)
    await this.firestoreService.writeDoc(operationCode, docPath, doc)
    const written = await this.firestoreService.readDoc(operationCode, docPath)
    this.log.details(`${operationCode} written:`, written)
    this.log.details(`${operationCode} took ${(Date.now() - time0) / 1000}ms`)
    return written as Result<Doc>
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
