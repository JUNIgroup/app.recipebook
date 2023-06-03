import { Log } from '../../utilities/logger'
import { createFakeLogger } from '../../utilities/logger/fake-logger.test-helper'

/**
 * Represents a firestore document.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents#Document
 */
export type Document = {
  name: string
  fields: { [key: string]: unknown }
  createTime: string
  updateTime: string
}

/**
 * Fast access to the Firestore REST API for testing.
 *
 * @see https://firebase.google.com/docs/firestore/reference/rest
 * @see https://firebase.google.com/docs/firestore/use-rest-api
 * @see https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/ArrayValue#Value
 * @see https://firebase.google.com/docs/firestore/reference/rest/Shared.Types/Document#Document
 * @see https://firebase.google.com/docs/emulator-suite/connect_firestore
 */
export class FirestoreTestHelper {
  readonly log: Log

  readonly endpoint: string

  constructor(readonly host: string, readonly port: number, readonly projectId: string, readonly databaseId: string) {
    this.log = createFakeLogger({ console: false })(`infra:firestore-api`)
    this.projectId = import.meta.env.VITE_FIREBASE__PROJECT_ID
    this.endpoint = `http://${host}:${port}/v1/projects/${projectId}/databases/${databaseId}/documents`
  }

  async deleteEmulatorDatabase() {
    const url = `http://${this.host}:${this.port}/emulator/v1/projects/${this.projectId}/databases/${this.databaseId}/documents`
    await this.fetch('DELETE', url, undefined)
  }

  async deleteEmulatorCollections(...paths: string[]) {
    await Promise.all(paths.map((path) => this.deleteEmulatorCollection(path)))
  }

  async deleteEmulatorCollection(path: string) {
    const documents: { name: string }[] = (await this.listDocuments(path)).documents || []
    const { transaction } = await this.beginTransaction()
    const commitUrl = `${this.endpoint}:commit`
    await this.fetch('POST', commitUrl, {
      writes: documents.map((doc) => ({ delete: doc.name })),
      transaction,
    })
  }

  async postDocument(path: string, document: object) {
    const url = `${this.endpoint}/${path}`
    return this.fetch('POST', url, document)
  }

  async patchDocument(path: string, document: object) {
    const url = `${this.endpoint}/${path}`
    return this.fetch('PATCH', url, document)
  }

  async getDocument(path: string) {
    const url = `${this.endpoint}/${path}`
    return this.fetch('GET', url, undefined)
  }

  async deleteDocument(path: string) {
    const url = `${this.endpoint}/${path}`
    return this.fetch('DELETE', url, undefined)
  }

  async listDocuments(path: string) {
    const url = `${this.endpoint}/${path}`
    return this.fetch('GET', url, undefined)
  }

  async listCollectionIds(path: string) {
    const url = `${this.endpoint}/${path}:listCollectionIds`
    return this.fetch('POST', url, undefined)
  }

  async beginTransaction() {
    const url = `${this.endpoint}:beginTransaction`
    return this.fetch('POST', url, {
      options: {
        readWrite: {},
      },
    })
  }

  async commit(transaction: string, collectionId: string, docs: { [id: string]: Partial<Document> }) {
    const url = `${this.endpoint}:commit`
    return this.fetch('POST', url, {
      writes: Object.entries(docs).map(([id, { updateTime, ...doc }]) => {
        this.log.details(`batch: ${id}, exists: ${Boolean(updateTime)}, update: ${updateTime ?? 'new'}`)
        return {
          currentDocument: updateTime ? { updateTime } : { exists: false },
          update: {
            name: `projects/${this.projectId}/databases/${this.databaseId}/documents/${collectionId}/${id}`,
            fields: doc.fields,
          },
        }
      }),
      transaction,
    })
  }

  private async fetch(method: string, url: string, body?: object) {
    this.log.details(`${method} ${url}`)
    this.log.details(`payload ${JSON.stringify(body)}`)
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
    this.log.details(`status: ${response.status} ${response.statusText}`)
    if (!response.ok) {
      const errorBody = await response.text()
      this.log.error(`error : ${errorBody}`)
      throw new Error(`${method} failed: ${response.status} ${response.statusText}: ${errorBody}`)
    }

    const data = await response.json()
    this.log.details(`data  : ${JSON.stringify(data, null, 2)}`)
    return data
  }
}
