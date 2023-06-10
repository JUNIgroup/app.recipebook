import { Observable, Subscriber } from 'rxjs'
import { Log, Logger } from '../../utilities/logger'
import { convertDocumentToResult } from './convert-from'
import { convertObjectToFields } from './convert-to'
import { EpochTimestamp, QueryResponseData, Result } from './types'

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
  apiEndpoint: string

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
export class FirestoreService {
  private readonly log: Log
  private readonly endpoint: string
  private readonly namePrefix: string
  private readonly keyParam: string

  /**
   * Instantiate a FirestoreService.
   *
   * @param logger the logger to use. Has to support the 'infra' category.
   * @param apiEndpoint the endpoint of the Firestore REST API
   */
  constructor(logger: Logger<'infra'>, options: FirestoreOptions) {
    this.log = logger('infra:FirestoreService')
    this.endpoint = `${options.apiEndpoint}/projects/${options.projectId}/databases/${options.databaseId}/documents`
    this.namePrefix = `projects/${options.projectId}/databases/${options.databaseId}/documents`
    this.keyParam = `key=${options.apiKey}`
  }

  readDocs(collectionPath: string[], after?: EpochTimestamp): Observable<Result> {
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
    subscriber: Subscriber<Result>,
    abortController: AbortController,
    collectionPath: string[],
    after?: EpochTimestamp,
  ) {
    try {
      const parent = this.createUrl(collectionPath.slice(0, -1))
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
      data.forEach((item) => {
        if (item.document) subscriber.next(convertDocumentToResult(item.document))
      })
      if (data[data.length - 1].done) subscriber.complete()
    } catch (error) {
      subscriber.error(error)
    }
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
    const url = `${this.endpoint}:commit?${this.keyParam}`
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

  /**
   * Delete a document from the database.
   *
   * @param docPath the path of the document to delete
   *
   * @see https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/delete
   */
  async delDoc(docPath: string[]): Promise<void> {
    const url = this.createUrl(docPath)
    await this.fetch('DELETE', url, undefined)
  }

  private createName(path: string[]): string {
    return `${this.namePrefix}/${path.join('/')}`
  }

  private createUrl(path: string[]): string {
    return path.length === 0 ? this.endpoint : `${this.endpoint}/${path.join('/')}`
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
      throw new Error(`${method} failed: ${response.status} ${response.statusText}: ${errorBody}`)
    }

    const data = await response.json()
    this.log.details(`data  : ${JSON.stringify(data, null, 2)}`)
    return data as T
  }
}
