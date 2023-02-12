/** The state of the DB. */
export enum DBOpenState {
  /** Upgrade of the DB is blocked. Please refresh all windows with this app */
  UPGRADE_BLOCKED = 'upgradeBlocked',

  /** Delete of the DB is blocked. Please refresh all windows with this app */
  DELETE_BLOCKED = 'deleteBlocked',

  /** DB could not be open and is not available */
  OPEN_FAILED = 'openFailed',

  /** DB is open and available */
  OPEN = 'open',

  /** DB could not be open and is not available */
  DELETE_FAILED = 'deleteFailed',

  /** DB is closed  */
  CLOSED = 'closed',

  /** DB is closed and deleted */
  DELETED = 'deleted',
}

/**
 * Up-to-date state of a DB object.
 */
export enum DBObjectState {
  /** The object is up to date with the cache. */
  DATABASE = 'database',

  /** The object is up to date with the cache. */
  CACHED = 'cached',

  /** The object is up to date with the cache and deleted */
  DELETED = 'deleted',

  /** The object is locally not up to date with the cache. */
  OUTDATED = 'outdated',
}

/**
 * Meta data additional stored to each DB object.
 */
export interface DBObjectMetaData {
  id: string
  changeIndex: number
  state: DBObjectState
}

/**
 * The cause why the object in the redux store is not up to date with the cache / DB.
 */
export enum OutdatedCause {
  LOCAL_NOT_FOUND = 'localNotFound',
  REMOTE_NOT_FOUND = 'remoteNotFound',
  REMOTE_DELETED = 'remoteDeleted',
  REMOTE_MODIFIED = 'remoteModified',
}
