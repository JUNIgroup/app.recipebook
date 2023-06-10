export type FirestoreDocumentWithLastUpdate = {
  name: string
  fields: {
    __lastUpdate: {
      timestampValue: string
    }
  }
  createTime: string
  updateTime: string
}

export type QueryResponseData = {
  document: FirestoreDocumentWithLastUpdate
  done?: boolean
}[]

/**
 * The number of milliseconds elapsed since the epoch (1970-01-01T00:00:00.000Z).
 *
 * E.g. this is the return value of Date.now().
 */
export type EpochTimestamp = number

/**
 * Result of 'readDocs' operation.
 */
export type Result = {
  /** The number of milliseconds elapsed since the epoch (1970-01-01T00:00:00.000Z). */
  lastUpdate: EpochTimestamp

  /** The document. */
  doc: object
}
