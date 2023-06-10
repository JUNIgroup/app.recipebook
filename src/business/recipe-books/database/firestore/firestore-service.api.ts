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
   * @param collectionPath the path to the collection to read from. Mast have an odd number of elements.
   * @param after (optional) only read documents that have been updated after this timestamp.
   * @returns an observable that emits the documents in the collection.
   */
  readDocs(collectionPath: string[], after?: EpochTimestamp): Observable<ReadDoc>

  /**
   * Write a single document to the database.
   *
   * @param docPath the path of the document to write. Must have an even number of elements.
   * @param doc the content of the document.
   * @returns a promise that resolves when the document has been written.
   */
  writeDoc(docPath: string[], doc: object): Promise<void>

  /**
   * Delete a single document from the database.
   *
   * @param docPath the path of the document to delete. Must have an even number of elements.
   * @returns a promise that resolves when the document has been deleted.
   */
  delDoc(docPath: string[]): Promise<void>
}
