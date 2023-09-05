import { memoryPersistence, nonePersistence, storagePersistence } from './persistence'

describe('nonePersistence', () => {
  it('should return instance', () => {
    const persistence = nonePersistence()
    expect(persistence).toBeDefined()
  })

  it('should initial load null', async () => {
    const persistence = nonePersistence()
    expect(persistence.load()).toBe(null)
  })

  it('should load null after save', async () => {
    const persistence = nonePersistence()
    persistence.save('foo-bar')
    expect(persistence.load()).toBe(null)
  })
})

describe('memoryPersistence', () => {
  it('should return instance', () => {
    const persistence = memoryPersistence()
    expect(persistence).toBeDefined()
  })

  it('should save string', async () => {
    const persistence = memoryPersistence()
    persistence.save('foo-bar')
    expect(persistence.memory).toEqual('foo-bar')
  })

  it('should save empty string', async () => {
    const persistence = memoryPersistence()
    persistence.save('')
    expect(persistence.memory).toEqual('')
  })

  it('should save null', async () => {
    const persistence = memoryPersistence()
    persistence.memory = 'foo-bar'
    persistence.save(null)
    expect(persistence.memory).toEqual(null)
  })

  it('should initial load null', async () => {
    const persistence = memoryPersistence()
    expect(persistence.load()).toBe(null)
  })

  it('should load null if memory is null', async () => {
    const persistence = memoryPersistence()
    persistence.memory = null
    expect(persistence.load()).toBe(null)
  })

  it('should load the stored string', async () => {
    const persistence = memoryPersistence()
    persistence.memory = 'foo-bar'
    expect(persistence.load()).toEqual('foo-bar')
  })
})

describe('storagePersistence', () => {
  let data: Record<string, string>
  let storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

  beforeEach(() => {
    data = {}
    storage = {
      getItem(key: string) {
        return data[key] ?? null
      },
      setItem(key: string, value: string) {
        data[key] = value
      },
      removeItem(key: string) {
        delete data[key]
      },
    }
  })

  it('should return instance', () => {
    const persistence = storagePersistence('foo', storage)
    expect(persistence).toBeDefined()
  })

  it('should save string', async () => {
    const persistence = storagePersistence('foo', storage)
    persistence.save('foo-bar')
    expect(data).toEqual({ foo: 'foo-bar' })
  })

  it('should save empty string', async () => {
    const persistence = storagePersistence('foo', storage)
    persistence.save('')
    expect(data).toEqual({ foo: '' })
  })

  it('should delete key if save null', async () => {
    const persistence = storagePersistence('foo', storage)
    persistence.save(null)
    expect(data).toEqual({})
  })

  it('should load null if key is not stored', async () => {
    const persistence = storagePersistence('foo', storage)
    delete data.foo
    expect(persistence.load()).toBe(null)
  })

  it('should load the stored string', async () => {
    const persistence = storagePersistence('foo', storage)
    data.foo = 'foo-bar'
    expect(persistence.load()).toEqual('foo-bar')
  })
})
