export type FirestoreDocument = {
  name: string
  fields?: object
  createTime: string
  updateTime: string
}

/**
 * The number of milliseconds elapsed since the epoch (1970-01-01T00:00:00.000Z).
 *
 * E.g. this is the return value of Date.now().
 */
export type EpochTimestamp = number

export type Result = {
  /** The number of milliseconds elapsed since the epoch (1970-01-01T00:00:00.000Z). */
  lastUpdate: EpochTimestamp

  /** The document. */
  doc: object
}
