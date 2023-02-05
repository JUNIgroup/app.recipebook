import { IDB_ID } from '../../../app.constants'
import { ServiceLogger } from '../../logger/logger'

const serviceName = 'FirebaseAuthService'

const createLogger = ServiceLogger(serviceName)

const DELETE_VERSION = -1

const dbUpgrades: ((db: IDBDatabase) => void)[] = [
  // version 0 ==> 1
  (db) => {
    db.createObjectStore('recipes', { keyPath: 'data.id' })
  },
]

interface IdbOpenCallbacks {
  onBlocked: (event: IDBVersionChangeEvent) => void
  onError: (error: DOMException) => void
  onOpen: () => void
}

interface IdbDeleteCallbacks {
  onBlocked: (event: IDBVersionChangeEvent) => void
  onError: (error: DOMException) => void
  onDelete: () => void
}

export class IdbService {
  private db: IDBDatabase | null = null

  constructor(private idb: IDBFactory) {}

  openDB(callbacks: IdbOpenCallbacks) {
    const logger = createLogger('openDB')
    const request: IDBOpenDBRequest = this.idb.open(IDB_ID, dbUpgrades.length)

    request.onupgradeneeded = ({ oldVersion, newVersion }: IDBVersionChangeEvent) => {
      if (newVersion && oldVersion < newVersion) {
        logger.log('upgrade from version %d to %d', oldVersion, newVersion)
        const db = request.result
        for (let version = oldVersion; version < newVersion; version += 1) {
          dbUpgrades[version](db)
        }
      }
    }

    request.onblocked = (event: IDBVersionChangeEvent) => {
      logger.log('upgrade blocked from version %d to %d', event.oldVersion, event.newVersion ?? DELETE_VERSION)
      callbacks.onBlocked(event)
    }

    request.onerror = () => {
      const error = request.error ?? new DOMException('unknown error')
      logger.error('open DB failed: %o', error)
      callbacks.onError(error)
      logger.end()
    }

    request.onsuccess = () => {
      this.db = request.result
      this.db.onclose = () => {
        localStorage.setItem('dbClosed', Date.now().toString())
      }
      logger.log('open DB succeed')
      callbacks.onOpen()
      logger.end()
    }
  }

  closeAndDeleteDB(callbacks: IdbDeleteCallbacks) {
    const logger = createLogger('closeAndDeleteDB')
    if (this.db) {
      logger.log('close DB')
      this.db.close()
      this.db = null
    }

    const request: IDBOpenDBRequest = this.idb.deleteDatabase(IDB_ID)
    request.onblocked = (event: IDBVersionChangeEvent) => {
      logger.log('upgrade blocked to delete DB')
      callbacks.onBlocked(event)
    }

    request.onerror = () => {
      const error = request.error ?? new DOMException('unknown error')
      logger.error('delete DB failed: %o', error)
      callbacks.onError(error)
      logger.end()
    }

    request.onsuccess = () => {
      this.db = request.result
      logger.log('delete DB succeed')
      callbacks.onDelete()
      logger.end()
    }
  }
}
