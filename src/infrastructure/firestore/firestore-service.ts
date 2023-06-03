import { Observable, Subscriber } from 'rxjs'
import { Log, Logger } from '../../utilities/logger'
import { EpochTimestamp, FirestoreDocument, Result } from './types'
import { convertDocumentToResult } from './convert-from'
import { convertObjectToFields } from './convert-to'

type FetchOptions = {
  signal?: AbortSignal
}

/**
 * Using the REST API to access the Firestore database.
 */
export class FirestoreService {
  private log: Log

  constructor(logger: Logger<'infra'>, private endpoint: string) {
    this.log = logger('infra:FirestoreService')
  }

  getDocs(collectionPath: string[], after?: EpochTimestamp): Observable<Result> {
    return new Observable((subscriber) => {
      const abortController = new AbortController()
      this.getDocsInternal(subscriber, abortController, collectionPath, after)
      return () => abortController.abort()
    })
  }

  private async getDocsInternal(
    subscriber: Subscriber<Result>,
    abortController: AbortController,
    collectionPath: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _after?: EpochTimestamp,
  ) {
    try {
      const url = this.createUrl(collectionPath)
      const data = await this.fetch('GET', url, undefined, { signal: abortController.signal })
      if ('documents' in data) {
        const documents = data.documents as FirestoreDocument[]
        documents.map(convertDocumentToResult).forEach((result) => subscriber.next(result))
      }
      subscriber.complete()
    } catch (error) {
      subscriber.error(error)
    }
  }

  async putDoc(docPath: string[], doc: object): Promise<Result> {
    const url = this.createUrl(docPath)
    const document = {
      fields: convertObjectToFields(doc),
    }
    const data = await this.fetch('PATCH', url, document)
    return convertDocumentToResult(data)
  }

  async delDoc(docPath: string[]): Promise<void> {
    const url = this.createUrl(docPath)
    await this.fetch('DELETE', url, document)
  }

  private createUrl(path: string[]): string {
    return `${this.endpoint}/${path.join('/')}`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fetch(method: string, url: string, body: object | undefined, options: FetchOptions = {}): Promise<any> {
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
    return data
  }
}
