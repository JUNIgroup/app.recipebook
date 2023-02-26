/**
 * Functions to persistence the authorization data between sessions.
 */
export interface AuthPersistence {
  name: string
  load(): object | null | Promise<object | null>
  save(value: object | null): void | Promise<void>
}

export function nonePersistence(): AuthPersistence {
  return {
    name: 'none',
    load: () => null,
    save: () => {},
  }
}

export function memoryPersistence(): AuthPersistence & { memory: object | null } {
  const persistence = {
    memory: null as object | null,
    name: 'memory',
    load: () => persistence.memory,
    save: (value: object | null) => {
      persistence.memory = value
    },
  }
  return persistence
}

export function storagePersistence(
  key: string,
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
): AuthPersistence {
  return {
    name: 'storage',
    load: () => {
      const value = storage.getItem(key)
      return value ? JSON.parse(value) : null
    },
    save: (value: object | null) => {
      if (value == null) storage.removeItem(key)
      else storage.setItem(key, JSON.stringify(value))
    },
  }
}
