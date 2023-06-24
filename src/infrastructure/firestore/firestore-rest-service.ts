import { Observable, Subscriber } from 'rxjs'
import {
  EpochTimestamp,
  FirestoreService,
  ReadDoc,
} from '../../business/recipe-books/database/firestore/firestore-service.api'
import { Log, Logger } from '../../utilities/logger'
import { convertDocumentToResult } from './convert-from'
import { convertObjectToFields } from './convert-to'
import { FirestoreRestError } from './firestore-rest-error'
import { FirestoreDocumentWithLastUpdate, QueryResponseData } from './types'

type FetchOptions = {
  signal?: AbortSignal
}

const setLastUpdate = {
  fieldPath: `__lastUpdate`,
  setToServerValue: 'REQUEST_TIME',
}

export type FirestoreOptions = {
  /**
   * The endpoint of the Firestore REST API.
   *
   * @example `https://firestore.googleapis.com/v1`
   */
  apiEndpoint: string | Promise<string>

  /**
   * The API key to access the Firestore REST API.
   */
  apiKey: string

  /**
   * The ID of the project.
   */
  projectId: string

  /**
   * The ID of the database.
   */
  databaseId: string
}

/**
 * Using the REST API to access the Firestore database.
 */
export class FirestoreRestService implements FirestoreService {
  private readonly log: Log
  private readonly endpoint: Promise<string>
  private readonly namePrefix: string
  private readonly keyParam: string

  /**
   * Instantiate a FirestoreService.
   *
   * @param logger the logger to use. Has to support the 'infra' category.
   * @param apiEndpoint the endpoint of the Firestore REST API
   */
  constructor(logger: Logger<'infra'>, options: FirestoreOptions) {
    this.log = logger('infra:FirestoreRestService')
    this.endpoint = FirestoreRestService.buildEndpoint(options)
    this.namePrefix = `projects/${options.projectId}/databases/${options.databaseId}/documents`
    this.keyParam = `key=${options.apiKey}`
  }

  private static async buildEndpoint(options: FirestoreOptions): Promise<string> {
    return `${await options.apiEndpoint}/projects/${options.projectId}/databases/${options.databaseId}/documents`
  }

  readDocs(collectionPath: string[], after?: EpochTimestamp): Observable<ReadDoc[]> {
    return new Observable((subscriber) => {
      const abortController = new AbortController()
      this.getDocsQuery(subscriber, abortController, collectionPath, after)
      return () => abortController.abort()
    })
  }

  /**
   * @see https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/runQuery
   */
  private async getDocsQuery(
    subscriber: Subscriber<ReadDoc[]>,
    abortController: AbortController,
    collectionPath: string[],
    after?: EpochTimestamp,
  ) {
    try {
      const parent = await this.createUrl(collectionPath.slice(0, -1))
      const url = `${parent}:runQuery?${this.keyParam}`
      const where = after
        ? {
            fieldFilter: {
              field: { fieldPath: '__lastUpdate' },
              op: 'GREATER_THAN',
              value: { timestampValue: new Date(after).toISOString() },
            },
          }
        : undefined
      const payload = {
        structuredQuery: {
          from: [{ collectionId: collectionPath.at(-1) }],
          orderBy: [{ field: { fieldPath: '__lastUpdate' }, direction: 'ASCENDING' }],
          where,
        },
      }
      const data = await this.fetch<QueryResponseData>('POST', url, payload, { signal: abortController.signal })
      const results = data.filter((item) => item.document).map((item) => convertDocumentToResult(item.document))
      if (results.length > 0) subscriber.next(results)
      if (data[data.length - 1].done) subscriber.complete()
    } catch (error) {
      subscriber.error(error)
    }
  }

  /**
   * Read a document from the database.
   *
   * @param docPath the path of the document to read
   *
   * @see https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/get
   */
  async readDoc(docPath: string[]): Promise<ReadDoc> {
    const url = await this.createUrl(docPath)
    const data = await this.fetch<FirestoreDocumentWithLastUpdate>('GET', url, undefined)
    if (!data.fields) throw new FirestoreRestError(`Document ${docPath.join('/')} not found.`)
    return convertDocumentToResult(data)
  }

  /**
   * Write a document to the database.
   *
   * @param docPath the path of the document to write
   * @param doc the content of the document
   *
   * @see https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/commit
   * @see https://firebase.google.com/docs/firestore/reference/rest/v1/Write
   */
  async writeDoc(docPath: string[], doc: object): Promise<void> {
    const name = this.createName(docPath)
    const url = `${await this.endpoint}:commit?${this.keyParam}`
    const payload = {
      writes: [
        {
          update: {
            name,
            fields: convertObjectToFields(doc),
          },
          updateTransforms: [setLastUpdate],
        },
      ],
    }
    await this.fetch('POST', url, payload)
  }

  private createName(path: string[]): string {
    return `${this.namePrefix}/${path.join('/')}`
  }

  private async createUrl(path: string[]): Promise<string> {
    return path.length === 0 ? this.endpoint : `${await this.endpoint}/${path.join('/')}`
  }

  private async fetch<T>(
    method: string,
    url: string,
    body: object | undefined,
    options: FetchOptions = {},
  ): Promise<T> {
    this.log.details(`${method} ${url}`)
    this.log.details(`payload ${JSON.stringify(body)}`)
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: options.signal,
    })
    this.log.details(`status: ${response.status} ${response.statusText}`)
    if (!response.ok) {
      const errorBody = await response.text()
      this.log.error(`error : ${errorBody}`)
      throw new FirestoreRestError(`${method} failed: ${response.status} ${response.statusText}: ${errorBody}`)
    }

    const data = await response.json()
    this.log.details(`data  : ${JSON.stringify(data, null, 2)}`)
    return data as T
  }
}
