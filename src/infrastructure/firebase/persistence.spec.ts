import { memoryPersistence, nonePersistence, storagePersistence } from './persistence'

describe('nonePersistence', () => {
  it('should return instance', () => {
    const persistence = nonePersistence()
    expect(persistence).toBeDefined()
  })

  it('should initial load null', async () => {
    const persistence = nonePersistence()
    expect(await persistence.load()).toBe(null)
  })

  it('should load null after save', async () => {
    const persistence = nonePersistence()
    persistence.save({ a: 1 })
    expect(await persistence.load()).toBe(null)
  })
})

describe('memoryPersistence', () => {
  it('should return instance', () => {
    const persistence = memoryPersistence()
    expect(persistence).toBeDefined()
  })

  it('should save object', async () => {
    const persistence = memoryPersistence()
    await persistence.save({ a: 1 })
    expect(persistence.memory).toEqual({ a: 1 })
  })

  it('should save null', async () => {
    const persistence = memoryPersistence()
    persistence.memory = { foo: 'bar' }
    await persistence.save(null)
    expect(persistence.memory).toEqual(null)
  })

  it('should initial load null', async () => {
    const persistence = memoryPersistence()
    expect(await persistence.load()).toBe(null)
  })

  it('should load null if memory is null', async () => {
    const persistence = memoryPersistence()
    persistence.memory = null
    expect(await persistence.load()).toBe(null)
  })

  it('should load the stored JSON object', async () => {
    const persistence = memoryPersistence()
    persistence.memory = { a: 1 }
    expect(await persistence.load()).toEqual({ a: 1 })
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

  it('should save object', async () => {
    const persistence = storagePersistence('foo', storage)
    await persistence.save({ a: 1 })
    expect(data).toEqual({ foo: '{"a":1}' })
  })

  it('should delete key if save null', async () => {
    const persistence = storagePersistence('foo', storage)
    await persistence.save(null)
    expect(data).toEqual({})
  })

  it('should load null if key is not stored', async () => {
    const persistence = storagePersistence('foo', storage)
    delete data.foo
    expect(await persistence.load()).toBe(null)
  })

  it('should load the stored JSON object', async () => {
    const persistence = storagePersistence('foo', storage)
    data.foo = '{"a":1}'
    expect(await persistence.load()).toEqual({ a: 1 })
  })
})
