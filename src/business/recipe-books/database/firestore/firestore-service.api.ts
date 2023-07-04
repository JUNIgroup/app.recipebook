import { Observable } from 'rxjs'

/**
 * The number of milliseconds elapsed since the epoch (1970-01-01T00:00:00.000Z).
 *
 * E.g. this is the return value of Date.now().
 */
export type EpochTimestamp = number

/**
 * Result of 'readDocs' operation.
 */
export type ReadDoc = {
  /** The number of milliseconds elapsed since the epoch (1970-01-01T00:00:00.000Z). */
  lastUpdate: EpochTimestamp

  /** The content of the document. */
  doc: object
}

/**
 * Interface for FirestoreService.
 */
export interface FirestoreService {
  /**
   * Read documents from the database.
   *
   * - The documents are returned in the order of their last update.
   * - The documents are returned in batches.
   *
   * @param operationCode the operation code to identify the trace in the logs.
   * @param collectionPath the path to the collection to read from. Mast have an odd number of elements.
   * @param after (optional) only read documents that have been updated after this timestamp.
   * @returns an observable that emits the documents in the collection.
   */
  readDocs(operationCode: string, collectionPath: string[], after?: EpochTimestamp): Observable<Array<ReadDoc>>

  /**
   * Read a single document from the database.
   *
   * @param operationCode the operation code to identify the trace in the logs.
   * @param docPath the path of the document to read. Must have an even number of elements.
   * @returns a promise that resolves to the document.
   * @throws an Error if the document does not exist.
   */
  readDoc(operationCode: string, docPath: string[]): Promise<ReadDoc>

  /**
   * Write a single document to the database.
   *
   * @param operationCode the operation code to identify the trace in the logs.
   * @param docPath the path of the document to write. Must have an even number of elements.
   * @param doc the content of the document.
   * @returns a promise that resolves when the document has been written.
   */
  writeDoc(operationCode: string, docPath: string[], doc: object): Promise<void>
}
