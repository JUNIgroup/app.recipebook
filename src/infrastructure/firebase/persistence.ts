/**
 * Functions to persistence the authorization data between sessions.
 */
export interface AuthPersistence {
  name: string
  load(): string | null
  save(value: string | null): void
}

export function nonePersistence(): AuthPersistence {
  return {
    name: 'none',
    load: () => null,
    save: () => {},
  }
}

export function memoryPersistence(): AuthPersistence & { memory: string | null } {
  const persistence = {
    memory: null as string | null,
    name: 'memory',
    load: () => persistence.memory,
    save: (value: string | null) => {
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
    load: () => storage.getItem(key),
    save: (value: string | null) => {
      if (value == null) storage.removeItem(key)
      else storage.setItem(key, value)
    },
  }
}
