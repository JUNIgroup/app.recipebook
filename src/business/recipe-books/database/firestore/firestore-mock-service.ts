import { Observable, bufferCount, defer, filter, of } from 'rxjs'
import { FirestoreService, ReadDoc } from './firestore-service.api'

export class FirestoreMockService implements FirestoreService {
  mockData: Map<string, Record<string, ReadDoc>> = new Map()

  /**
   * Number of documents, `readDocs` returns in each batch.
   *
   * @default all documents in one batch
   */
  readDocsBatchSize?: number

  readDocs(collectionPath: string[], after?: number | undefined): Observable<ReadDoc[]> {
    return defer(() => {
      const record = this.getRecord(collectionPath)
      const docs = Object.values(record).sort((a, b) => a.lastUpdate - b.lastUpdate)
      return of(...docs).pipe(
        filter((doc) => !after || doc.lastUpdate > after),
        bufferCount(this.readDocsBatchSize ?? docs.length),
      )
    })
  }

  async readDoc(docPath: string[]): Promise<ReadDoc> {
    const { parentPath, docId } = splitDocPath(docPath)
    const record = this.getRecord(parentPath)
    const doc = record[docId]
    if (!doc) throw new Error(`Document not found: ${docPath.join('/')}`)
    return doc
  }

  async writeDoc(docPath: string[], doc: object): Promise<void> {
    const { parentPath, docId } = splitDocPath(docPath)
    const record = this.getRecord(parentPath)
    const lastUpdate = Date.now()
    record[docId] = { lastUpdate, doc }
  }

  private getRecord(path: string[]): Record<string, ReadDoc> {
    const key = path.join('/')
    let record = this.mockData.get(key)
    if (!record) {
      record = {}
      this.mockData.set(key, record)
    }
    return record
  }
}

function splitDocPath(docPath: string[]): { parentPath: string[]; docId: string } {
  const parentPath = docPath.slice(0, -1)
  const docId = docPath[docPath.length - 1]
  return { parentPath, docId }
}
