export type FirestoreDocument = {
  name: string
  fields?: object
  createTime: string
  updateTime: string
}

export type Result = {
  /** The number of milliseconds elapsed since the epoch (1970-01-01T00:00:00.000Z). */
  lastUpdate: number

  /** The document. */
  doc: object
}
