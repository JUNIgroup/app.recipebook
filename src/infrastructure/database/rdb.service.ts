/**
 * Callback for the openDB request of the remote DB.
 */
export interface RdbOpenCallbacks {
  onBlocked: () => void
  onError: (error: Error) => void
  onOpen: () => void
}

/**
 * Callback for the closeAndDeleteDB request of the remote DB.
 */
export interface RdbDeleteCallbacks {
  onBlocked: () => void
  onError: (error: Error) => void
  onDelete: () => void
}

/**
 * ID of a data object stored in the remote DB.
 */
export type ID = string

/**
 * Data object stored in the remote DB.
 * Includes at least an ID.
 */
export type RdbData = unknown & { id: ID }

/**
 * Metadata stored additional to the regular data in the remote DB.
 */
export type RdbMeta = {
  changeIndex: number
  deleted?: true
}

/**
 * Read operation allowed on a store in the remote DB.
 */
export interface ReadTransaction<StoreName extends string> {
  abort(message?: string): never
  getAll(storeName: StoreName): Promise<RdbData[]>
  get(storeName: StoreName, id: ID): Promise<RdbData | null>
}

/**
 * Update operation allowed on a store in the remote DB.
 */
export interface UpdateTransaction<StoreName extends string> {
  abort(message?: string): never
  add(storeName: StoreName, data: RdbData): Promise<void>
  update(storeName: StoreName, data: RdbData): Promise<void>
  delete(storeName: StoreName, id: ID): Promise<void>
}

export interface ReadCallbacks<T, StoreName extends string> {
  /**
   * Callback to execute the read operations in a read transition.
   *
   * @param rtx read transaction to execute the read operations
   * @returns result of the read operations
   */
  onTransaction: (rtx: ReadTransaction<StoreName>) => Promise<T>
}

/**
 * Metadata of the data objects.
 */
export type MetaRecord = Record<ID, RdbMeta>

export interface UpdateCallbacks<StoreName extends string> {
  /**
   * Callback to execute the read operations in a read transition.
   *
   * @param utx update transaction to execute the update operations
   * @returns result of the update operations
   */
  onTransaction: (utx: UpdateTransaction<StoreName>) => Promise<void>

  /**
   * Checks the metadata of the data objects before the update was applied.
   * @param metaRecord the metadata of the data objects before the update was applied
   * @throws an error if the metadata is invalid
   */
  validatePreviousMeta: (metaRecord: MetaRecord) => void
}

/**
 * Service to access the remote DB.
 */
export interface RdbService<SupportedStoreName extends string> {
  /**
   * Open the remote DB.
   * Call the callbacks when the DB is opened, blocked or an error occurs.
   *
   * Handle the upgrade of the DB if needed.
   *
   * @param callbacks callbacks to call when the DB is opened, blocked or an error occurs.
   */
  openDB(callbacks: RdbOpenCallbacks): void

  /**
   * Close the remote DB and delete it.
   * Call the callbacks when the DB is deleted, blocked or an error occurs.
   *
   * @param callbacks callbacks to call when the DB is deleted, blocked or an error occurs.
   */
  closeAndDeleteDB(callbacks: RdbDeleteCallbacks): void

  /**
   * Execute a read (only) transaction on the remote DB.
   *
   * @param storeNames one or more store names, which are allowed to access while reading
   * @param onReadTransaction the operations to execute in the read transaction
   */
  executeReadTransaction<T, StoreName extends SupportedStoreName>(
    storeNames: StoreName | StoreName[],
    callbacks: ReadCallbacks<T, StoreName>,
  ): Promise<[MetaRecord, T]>

  /**
   * Execute an update (check and write) transaction on the remote DB.
   *
   * @param storeNames one or more store names, which are allowed to access while updating
   * @param onReadTransaction the operations to execute in the update transaction
   */
  executeUpdateTransaction<StoreName extends SupportedStoreName>(
    storeNames: StoreName | StoreName[],
    callbacks: UpdateCallbacks<StoreName>,
  ): Promise<[MetaRecord]>
}
