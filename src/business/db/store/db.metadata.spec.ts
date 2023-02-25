import { MetaRecord } from '../../../infrastructure/database/rdb.service'
import { convertMetaRecordToMetaData, validateUpdateMetaRecord } from './db.metadata'
import { DBObjectMetaData, DBObjectState, OutdatedCause } from './db.types'

describe(convertMetaRecordToMetaData.name, () => {
  it('should return meta data of meta record of changed data', () => {
    const metaRecord: MetaRecord = {
      'test-id-1': { changeIndex: 3 },
      'test-id-2': { changeIndex: 1 },
    }

    const metaData = convertMetaRecordToMetaData(metaRecord)

    expect(metaData).toEqual([
      { id: 'test-id-1', changeIndex: 3, state: DBObjectState.CACHED },
      { id: 'test-id-2', changeIndex: 1, state: DBObjectState.CACHED },
    ])
  })

  it('should return meta data of meta record of deleted data', () => {
    const metaRecord: MetaRecord = {
      'test-id-3': { changeIndex: 5, deleted: true },
    }

    const metaData = convertMetaRecordToMetaData(metaRecord)

    expect(metaData).toEqual([
      { id: 'test-id-3', changeIndex: 5, state: DBObjectState.DELETED }, //
    ])
  })

  it('should return meta data of meta record of not found data', () => {
    const metaRecord: MetaRecord = {
      'test-id-4': { changeIndex: NaN, deleted: true },
    }

    const metaData = convertMetaRecordToMetaData(metaRecord)

    expect(metaData).toEqual([
      { id: 'test-id-4', changeIndex: NaN, state: DBObjectState.DELETED }, //
    ])
  })
})

describe(validateUpdateMetaRecord.name, () => {
  describe('valid update operations', () => {
    it('should return null, if meta record before and initial meta data are not defined (add operation)', () => {
      const metaRecord: MetaRecord = {}
      const initialMetaData: Record<string, DBObjectMetaData> = {}

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toBeNull()
    })

    it('should return null, if meta record before matches initial meta data (update/delete operation)', () => {
      const metaRecord: MetaRecord = {
        'test-id-1': { changeIndex: 1 },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {
        'test-id-1': { id: 'test-id-1', changeIndex: 1, state: DBObjectState.CACHED },
      }

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toBeNull()
    })

    it('should return null, if meta record before matches initial meta data (already deleted)', () => {
      const metaRecord: MetaRecord = {
        'test-id-1': { changeIndex: 1, deleted: true },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {
        'test-id-1': { id: 'test-id-1', changeIndex: 1, state: DBObjectState.DELETED },
      }

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toBeNull()
    })
  })

  describe('aborted update operations because of outdated local data', () => {
    it('should return outdated object with cause "local not found", if initial meta data for ID is undefined', () => {
      const metaRecord: MetaRecord = {
        'test-id-1': { changeIndex: 1 },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {}

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toEqual({
        'test-id-1': OutdatedCause.LOCAL_NOT_FOUND,
      })
    })

    it('should return outdated object with cause "remote not found", if meta record before for ID is undefined', () => {
      const metaRecord: MetaRecord = {
        'test-id-1': { changeIndex: NaN, deleted: true },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {
        'test-id-1': { id: 'test-id-1', changeIndex: 1, state: DBObjectState.CACHED },
      }

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toEqual({
        'test-id-1': OutdatedCause.REMOTE_NOT_FOUND,
      })
    })

    it('should return outdated object with cause "remote delete", if meta record before is marked as deleted', () => {
      const metaRecord: MetaRecord = {
        'test-id-1': { changeIndex: 1, deleted: true },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {
        'test-id-1': { id: 'test-id-1', changeIndex: 0, state: DBObjectState.CACHED },
      }

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toEqual({
        'test-id-1': OutdatedCause.REMOTE_DELETED,
      })
    })

    it('should return outdated object with cause "remote modified", if meta record before has other change version', () => {
      const metaRecord: MetaRecord = {
        'test-id-1': { changeIndex: 3 },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {
        'test-id-1': { id: 'test-id-1', changeIndex: 1, state: DBObjectState.CACHED },
      }

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toEqual({
        'test-id-1': OutdatedCause.REMOTE_MODIFIED,
      })
    })
  })

  describe('multiple update operations', () => {
    it('should return outdated objects with cause', () => {
      const metaRecord: MetaRecord = {
        // 'up-to-date-1': undefined,
        'up-to-date-2': { changeIndex: 1 },
        'up-to-date-3': { changeIndex: 1, deleted: true },
        'outdated-1': { changeIndex: 1 },
        'outdated-2': { changeIndex: NaN, deleted: true },
        'outdated-3': { changeIndex: 1, deleted: true },
        'outdated-4': { changeIndex: 3 },
      }
      const initialMetaData: Record<string, DBObjectMetaData> = {
        // up-to-date-1: undefined
        'up-to-date-2': { id: 'up-to-date-2', changeIndex: 1, state: DBObjectState.CACHED },
        'up-to-date-3': { id: 'up-to-date-3', changeIndex: 1, state: DBObjectState.DELETED },
        // outdated-1: undefined
        'outdated-2': { id: 'outdated-2', changeIndex: 1, state: DBObjectState.CACHED },
        'outdated-3': { id: 'outdated-3', changeIndex: 0, state: DBObjectState.CACHED },
        'outdated-4': { id: 'outdated-4', changeIndex: 1, state: DBObjectState.CACHED },
      }

      const outdated = validateUpdateMetaRecord(metaRecord, initialMetaData)

      expect(outdated).toEqual({
        'outdated-1': OutdatedCause.LOCAL_NOT_FOUND,
        'outdated-2': OutdatedCause.REMOTE_NOT_FOUND,
        'outdated-3': OutdatedCause.REMOTE_DELETED,
        'outdated-4': OutdatedCause.REMOTE_MODIFIED,
      })
    })
  })
})
