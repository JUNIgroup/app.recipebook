import { MetaRecord, RdbMeta } from '../../../infrastructure/database/rdb.service'
import { DBObjectMetaData, DBObjectState, OutdatedCause } from './db.types'

export function convertMetaRecordToMetaData(metaRecord: MetaRecord): DBObjectMetaData[] {
  const metaData: DBObjectMetaData[] = Object.entries(metaRecord).map(([id, meta]) => ({
    id,
    changeIndex: meta.changeIndex,
    state: meta.deleted ? DBObjectState.DELETED : DBObjectState.CACHED,
  }))
  return metaData
}

export function validateUpdateMetaRecord(
  metaRecord: MetaRecord,
  initialMetaData: Record<string, DBObjectMetaData>,
): null | Record<string, OutdatedCause> {
  function validate(local: DBObjectMetaData | undefined, remote: RdbMeta): OutdatedCause | null {
    const remoteNotFound = Number.isNaN(remote.changeIndex) && remote.deleted
    if (local === undefined && remoteNotFound) return null
    if (local === undefined) return OutdatedCause.LOCAL_NOT_FOUND
    if (remoteNotFound) return OutdatedCause.REMOTE_NOT_FOUND
    if (local.changeIndex === remote.changeIndex) return null
    return remote.deleted ? OutdatedCause.REMOTE_DELETED : OutdatedCause.REMOTE_MODIFIED
  }

  let outdated = false
  const outdatedObjects: Record<string, OutdatedCause> = {}
  Object.entries(metaRecord).forEach(([id, remote]) => {
    const cause = validate(initialMetaData[id], remote)
    if (cause != null) {
      outdated = true
      outdatedObjects[id] = cause
    }
  })
  return outdated ? outdatedObjects : null
}
