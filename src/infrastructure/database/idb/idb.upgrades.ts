import { IdbUpgrades } from './idb.service'

/**
 * The type accepting all names for stores.
 *  */
export type SupportedStoreName = 'recipes'

/**
 * An array of functions to upgrade the DB.
 * Each function upgrades the DB from one version to the next.
 */
const dbUpgradeSteps: ((db: IDBDatabase) => void)[] = [
  // version 0 ==> 1
  (db) => {
    db.createObjectStore('recipes', { keyPath: 'data.id' })
  },
]

export const dbVersion = dbUpgradeSteps.length

export const dbUpgrades: IdbUpgrades = ({ db, oldVersion, newVersion, logger }) => {
  logger.log('upgrade from version %d to %d', oldVersion, newVersion)
  for (let version = oldVersion; version < newVersion; version += 1) {
    dbUpgradeSteps[version](db)
  }
}
