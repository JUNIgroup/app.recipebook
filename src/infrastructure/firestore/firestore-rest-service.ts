import { Observable, Subscriber } from 'rxjs'
import { EpochTimestamp, FirestoreService, ReadDoc } from '../../business/database/firestore/firestore-service.api'
import { Log, Logger } from '../../utilities/logger'
import { convertDocumentToResult } from './convert-from'
import { convertObjectToFields } from './convert-to'
import { FirestoreRestError } from './firestore-rest-error'
import { FirestoreDocumentWithLastUpdate, QueryResponseData } from './types'
import { FirestoreNetworkError } from './firestore-network-error'

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
  private readonly abortControllers = new Map<string, AbortController>()
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

  readDocs(operation: string, collectionPath: string[], after?: EpochTimestamp): Observable<ReadDoc[]> {
    return new Observable((subscriber) => {
      const abortController = this.prepareQuery(collectionPath)
      this.getDocsQuery(operation, subscriber, abortController, collectionPath, after)
      return () => abortController.abort('unsubscribe')
    })
  }

  private prepareQuery(collectionPath: string[]): AbortController {
    const key = collectionPath.join('/')
    const previousAbortController = this.abortControllers.get(key)
    if (previousAbortController) {
      previousAbortController.abort('new query')
    }
    const abortController = new AbortController()
    this.abortControllers.set(key, abortController)
    return abortController
  }

  /**
   * @see https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/runQuery
   */
  private async getDocsQuery(
    operationCode: string,
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
      const data = await this.fetch<QueryResponseData>({
        operationCode,
        method: 'POST',
        url,
        payload,
        signal: abortController.signal,
      })
      const results = data.filter((item) => item.document).map((item) => convertDocumentToResult(item.document))
      if (results.length > 0) subscriber.next(results)
      if (data[data.length - 1].done) subscriber.complete()
    } catch (error) {
      if (error instanceof FirestoreNetworkError) {
        subscriber.complete()
      } else {
        subscriber.error(error)
      }
    }
  }

  /**
   * Read a document from the database.
   *
   * @param docPath the path of the document to read
   *
   * @see https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/get
   */
  async readDoc(operationCode: string, docPath: string[]): Promise<ReadDoc> {
    const url = await this.createUrl(docPath)
    const data = await this.fetch<FirestoreDocumentWithLastUpdate>({
      operationCode,
      method: 'GET',
      url,
    })
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
  async writeDoc(operationCode: string, docPath: string[], doc: object): Promise<void> {
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
    await this.fetch({
      operationCode,
      method: 'POST',
      url,
      payload,
    })
  }

  private createName(path: string[]): string {
    return `${this.namePrefix}/${path.join('/')}`
  }

  private async createUrl(path: string[]): Promise<string> {
    return path.length === 0 ? this.endpoint : `${await this.endpoint}/${path.join('/')}`
  }

  private async fetch<T>(options: FetchOptions): Promise<T> {
    const { operationCode, method, url, payload, signal } = options
    this.log.details(`${operationCode} ${method} ${url}`)
    this.log.details(`${operationCode} payload:`, payload)

    const fetchInit = {
      method,
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      headers: jsonHeaders,
      body: JSON.stringify(payload),
      signal,
    }

    const response = await fetch(url, fetchInit).catch((error) => this.catchNetworkError(operationCode, error))
    await this.checkResponseStatus(operationCode, method, response)

    const data = await response.json()
    this.log.details(`${operationCode} data  :`, data)
    return data as T
  }

  private catchNetworkError(operationCode: string, error: Error): never {
    if (error.name === 'AbortError') {
      this.log.error(`${operationCode} aborted: ${error.message}`)
      throw new FirestoreNetworkError(`aborted: ${error.message}`, true)
    } else {
      this.log.error(`${operationCode} network error: ${error.message}`)
      throw new FirestoreNetworkError(`network error: ${error.message}`, false)
    }
  }

  private async checkResponseStatus(operationCode: string, method: string, response: Response): Promise<void> {
    this.log.details(`${operationCode} status: ${response.status} ${response.statusText}`)
    if (response.ok) return

    const errorBody = await response.text()
    this.log.error(`${operationCode} error : ${errorBody}`)
    throw new FirestoreRestError(`${method} failed: ${response.status} ${response.statusText}: ${errorBody}`)
  }
}

const jsonHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

type FetchOptions = {
  operationCode: string
  method: string
  url: string
  payload?: object
  signal?: AbortSignal
}
