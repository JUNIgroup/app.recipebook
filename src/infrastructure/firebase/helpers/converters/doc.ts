import { asPrimitive, asRecord, assertEmptyRest, parseError } from './basics'
import { TimestampType, parseTimestamp, Timestamp } from './timestamp'
import { parseMapFields, Value, ValueType } from './value'

export type DocType = {
  // --- metadata ---
  name: string
  createTime: TimestampType
  updateTime: TimestampType

  // --- data ---
  fields: Record<string, ValueType>
}

export type Doc = {
  /**
   * The resource id, the last part of the document path.
   */
  readonly id: string

  /**
   * The document path, e.g. `projects/my-project/databases/(default)/documents/collection/document`
   */
  readonly name: string

  /**
   * The time at which the document was created.
   */
  readonly createTime: Timestamp

  /**
   * The time at which the document was last updated.
   */
  readonly updateTime: Timestamp

  /**
   * The document data.
   */
  data: Record<string, Value>
}

/**
 * Converts a Firestore document to a internally {@link Doc}.
 *
 * @param value the document to convert
 * @returns the converted document
 */
export function parseDoc(doc: unknown): Doc {
  const { name, createTime, updateTime, fields, ...rest } = asRecord(doc, 'document')
  assertEmptyRest(rest, 'document')

  const fullName = asPrimitive('string', name, 'document.name')
  const match = fullName.match(/\/([^/]+)$/)
  if (!match) throw parseError(name, 'a document name with /«id» at the end')

  return {
    id: match[1],
    name: fullName,
    createTime: parseTimestamp(createTime),
    updateTime: parseTimestamp(updateTime),
    data: parseMapFields(fields),
  }
}
