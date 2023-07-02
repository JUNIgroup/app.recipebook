import { Doc } from '../../database/database-types'

/**
 * This function extends an existing prepare function with a check that the document has revision 0.
 *
 * Use this extension for thunk actions that create new documents.
 *
 * @param prepare the prepare function to extend
 * @returns a new prepare function that throws if the document has a revision other than 0
 */
export function checkRevisionZero<P, T extends { document: Doc }>(prepare: (payload: P) => T): (payload: P) => T {
  return (payload: P) => {
    const prepared = prepare(payload)
    if (prepared.document.rev !== 0) {
      throw new Error('Expect revision to be 0 for new document.')
    }
    return prepared
  }
}

/**
 * This function extends an existing prepare function with a check that the document has not been deleted.
 *
 * Use this extension for thunk actions that update existing documents.
 *
 * @param prepare the prepare function to extend
 * @returns a new prepare function that throws if the document has been deleted
 */
export function checkNotDeleted<P, T extends { document: Doc }>(prepare: (payload: P) => T): (payload: P) => T {
  return (payload: P) => {
    const prepared = prepare(payload)
    // eslint-disable-next-line no-underscore-dangle
    if (prepared.document.__deleted) {
      throw new Error('Expect document to not be deleted.')
    }
    return prepared
  }
}

/**
 * This function extends an existing prepare function with an increase of the document revision.
 *
 * Use this extension for thunk actions that update or delete existing documents.
 *
 * @param prepare the prepare function to extend
 * @returns a new prepare function that increases the document revision
 */
export function increaseRevision<P, T extends { document: Doc }>(prepare: (payload: P) => T): (payload: P) => T {
  return (payload: P) => {
    const prepared = prepare(payload)
    return {
      ...prepared,
      document: {
        ...prepared.document,
        rev: prepared.document.rev + 1,
      },
    }
  }
}

/**
 * This function extends an existing prepare function with a mark that the document has been deleted.
 *
 * Use this extension for thunk actions that delete existing documents.
 *
 * @param prepare the prepare function to extend
 * @returns a new prepare function that marks the document as deleted
 */
export function markDeleted<P, T extends { document: Doc }>(prepare: (payload: P) => T): (payload: P) => T {
  return (payload: P) => {
    const prepared = prepare(payload)
    return {
      ...prepared,
      document: {
        id: prepared.document.id,
        rev: prepared.document.rev,
        __deleted: true,
      },
    }
  }
}
