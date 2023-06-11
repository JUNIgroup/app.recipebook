import { Observable, filter } from 'rxjs'
import { Log, Logger } from '../../../../utilities/logger'
import { CollectionPath, Database, Result } from '../database'
import { DatabaseStructure, Doc, EpochTimestamp } from '../database-types'
import { DatabaseSchemas } from './schema'
import { Validator, databaseSchemaValidator, idValidator, revisionValidator } from './validator'

/**
 * Defines the validators used to check the documents,
 * that are read from or written to the database.
 */
export type Validators = {
  /**
   * Validators for documents read from the database.
   *
   * `getDocs` will validate each document, that is read from the database.
   * If a document does not pass all validators, it will be ignored.
   *
   * `putDoc` will validate the final document, that is written to the database.
   * If the document does not pass all validators, an error will be thrown.
   */
  get: Validator[]

  /**
   * Validators for documents written to the database.
   *
   * `putDoc` will validate the document, before it is written to the database.
   * If the document does not pass all validators, an error will be thrown.
   */
  put: Validator[]

  /**
   * Validators for documents deleted from the database.
   *
   * `delDoc` will validate the document, before it is deleted from the database.
   * If the document does not pass all validators, an error will be thrown.
   */
  del: Validator[]
}

/**
 * The recommended validators for the database.
 *
 * The result depends from the build mode of the application.
 *
 * @returns the recommended validators for the database.
 */
export function createRecommendedValidators<T extends DatabaseStructure>(
  databaseSchemas: DatabaseSchemas<T>,
): Validators {
  if (process.env.NODE_ENV === 'production') {
    return {
      get: [databaseSchemaValidator(databaseSchemas)],
      put: [],
      del: [],
    }
  }

  // development and test
  const validators = [idValidator(), revisionValidator(), databaseSchemaValidator(databaseSchemas)]
  return {
    get: validators,
    put: validators,
    del: validators,
  }
}

/**
 * A database, that validates the documents, that are read from or written to the database.
 *
 * Secures the calls to the inside database by validating the arguments before and the results after.
 *
 * @param database the database to secure.
 */
export class ValidatingDatabase implements Database {
  private readonly log: Log
  private readonly getValidators: Validator[]
  private readonly putValidators: Validator[]
  private readonly delValidators: Validator[]

  constructor(logger: Logger<'business'>, private readonly database: Database, validators: Partial<Validators> = {}) {
    this.log = logger('business:ValidatingDatabase')
    this.getValidators = validators.get ?? []
    this.putValidators = validators.put ?? []
    this.delValidators = validators.del ?? []
  }

  getDocs(path: CollectionPath, after?: EpochTimestamp): Observable<Result<Doc>> {
    const docs$ = this.database.getDocs(path, after)
    if (this.getValidators.length === 0) return docs$
    const isValidDoc = (doc: Doc) =>
      this.validateDoc('[getDocs] Ignore invalid document', this.getValidators, path, doc) === null
    return docs$.pipe(filter(({ doc }) => isValidDoc(doc)))
  }

  async putDoc(path: CollectionPath, doc: Doc): Promise<Result<Doc>> {
    const payloadError = this.validateDoc('[putDoc] Reject writing of invalid document', this.putValidators, path, doc)
    if (payloadError) {
      throw new Error(`Can't write invalid document: ${payloadError}`)
    }
    const result = this.database.putDoc(path, doc)
    const resultError = this.validateDoc('[putDoc] Ignore invalid written document', this.getValidators, path, doc)
    if (resultError) {
      throw new Error(`Can't handle written document: ${resultError}`)
    }
    return result
  }

  async delDoc(path: CollectionPath, doc: Doc): Promise<void> {
    const error = this.validateDoc('[delDoc] Reject deleting of invalid document', this.delValidators, path, doc)
    if (error) {
      throw new Error(`Can't delete invalid document: ${error}`)
    }
    return this.database.delDoc(path, doc)
  }

  private validateDoc(logPrefix: string, validators: Validator[], path: CollectionPath, doc: Doc): null | string {
    if (validators.length === 0) return null
    const totalError = validators.reduce<null | string>((error, validator) => error ?? validator(path, doc), null)
    if (totalError == null) return null

    this.log.error(`${logPrefix} ${docPath(path, doc)}: ${totalError}`)
    this.log.error(`   ${JSON.stringify(doc)}`)
    return totalError
  }
}

function docPath(path: CollectionPath, doc: Doc): string {
  const fallback = '«unknown»'
  const { bucket = fallback } = path
  const { id = fallback } = doc
  if (!('collection' in path)) return `${bucket}/${id}`

  const { bucketId = fallback, collection = fallback } = path
  return `${bucket}/${bucketId}/${collection}/${id}`
}
