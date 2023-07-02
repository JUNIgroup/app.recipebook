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
