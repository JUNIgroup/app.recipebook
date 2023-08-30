/* eslint-disable solid/reactivity */

import { createEffect, createRoot } from 'solid-js'
import { SetStoreFunction, Store, createStore } from 'solid-js/store'

describe('store with document', () => {
  describe('update array of primitives', () => {
    type Document = { id: number; geo: { x: number; y: number; z?: number } }
    type DocStore = {
      ids: number[]
      docs: Record<string, Document>
    }

    const fullDoc: Document = {
      id: 0,
      geo: { x: 1, y: 2, z: 3 },
    }

    let store: Store<DocStore>
    let update: SetStoreFunction<DocStore>

    beforeEach(() => {
      // eslint-disable-next-line solid/reactivity
      ;[store, update] = createStore<DocStore>({ ids: [], docs: {} })
    })

    it('should update ids - direct value', () => {
      // execute
      update({ ids: [42], docs: { '99': fullDoc } })
      update({ ids: [2, 3] })

      // observed
      expect(store).toEqual({ ids: [2, 3], docs: { '99': fullDoc } })
    })

    it('should update ids - path', () => {
      // execute
      update({ ids: [42], docs: { '99': fullDoc } })
      update('ids', [2, 3])

      // observed
      expect(store).toEqual({ ids: [2, 3], docs: { '99': fullDoc } })
    })

    it('should update ids - path to new item', () => {
      // execute
      update({ ids: [42], docs: { '99': fullDoc } })
      const len = store.ids.length
      update('ids', len, 21)

      // observed
      expect(store).toEqual({ ids: [42, 21], docs: { '99': fullDoc } })
    })

    it('should update ids - root function override', () => {
      // execute
      update({ ids: [42], docs: { '99': fullDoc } })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      update((root) => ({ ids: [2, 3] }))

      // observed
      expect(store).toEqual({ ids: [2, 3], docs: { '99': fullDoc } })
    })

    it('should update ids - part function override', () => {
      // execute
      update({ ids: [42], docs: { '99': fullDoc } })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      update('ids', (ids) => [2, 3])

      // observed
      expect(store).toEqual({ ids: [2, 3], docs: { '99': fullDoc } })
    })

    it('should update ids - part function append', () => {
      // execute
      update({ ids: [42], docs: { '99': fullDoc } })
      update('ids', (ids) => [...ids, 2, 3])

      // observed
      expect(store).toEqual({ ids: [42, 2, 3], docs: { '99': fullDoc } })
    })

    it('should update ids - part function filter', () => {
      // execute
      update({ ids: [42, 2, 3], docs: { '99': fullDoc } })
      update('ids', (ids) => ids.filter((id) => id !== 2))

      // observed
      expect(store).toEqual({ ids: [42, 3], docs: { '99': fullDoc } })
    })

    it('should update ids - part function splice', () => {
      // execute
      update({ ids: [42, 2, 3], docs: { '99': fullDoc } })
      update('ids', (ids) => {
        ids.splice(1, 1)
        return ids
      })

      // observed
      expect(store).toEqual({ ids: [42, 3], docs: { '99': fullDoc } })
    })
  })

  describe('array of complex objects', () => {
    type Foo = { foo: string; baz?: string }
    type FooStore = { foos: Foo[] }

    let dispose: () => void

    let store: Store<FooStore>
    let update: SetStoreFunction<FooStore>

    let subStore: Store<Foo>
    let subUpdate: SetStoreFunction<Foo>

    let fooBy2ndIndexJson: string[]
    let fooBy2ndIndexString: string[]
    let fooByCAttributeJson: string[]
    let fooByCAttributeString: string[]
    let fooSubStoreJson: string[]
    let fooSubStoreString: string[]

    beforeEach(() => {
      fooBy2ndIndexJson = []
      fooBy2ndIndexString = []
      fooByCAttributeJson = []
      fooByCAttributeString = []
      fooSubStoreJson = []
      fooSubStoreString = []

      const asJson = (f: Foo | undefined) => {
        if (!f) return ''
        return Object.entries(f)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}:${v}`)
          .join(',')
      }

      createRoot((d) => {
        dispose = d
        ;[store, update] = createStore<FooStore>({ foos: [{ foo: 'A' }, { foo: 'B' }, { foo: 'C' }] })
        createEffect(() => fooBy2ndIndexJson.push(asJson(store.foos[2])))
        createEffect(() => fooBy2ndIndexString.push(store.foos[2]?.foo))
        createEffect(() => fooByCAttributeJson.push(asJson(store.foos.find((f) => f.foo === 'C'))))
        createEffect(() => fooByCAttributeString.push(store.foos.find((f) => f.foo === 'C')?.foo ?? ''))
        ;[subStore, subUpdate] = createStore<Foo>(store.foos[2])
        createEffect(() => fooSubStoreJson.push(asJson(subStore)))
        createEffect(() => fooSubStoreString.push(subStore.foo))
      })
    })

    afterEach(() => {
      dispose?.()
    })

    function record() {
      return {
        fooBy2ndIndexJson: fooBy2ndIndexJson.join('|'),
        fooBy2ndIndexString: fooBy2ndIndexString.join('|'),
        fooByCAttributeJson: fooByCAttributeJson.join('|'),
        fooByCAttributeString: fooByCAttributeString.join('|'),
        fooSubStoreJson: fooSubStoreJson.join('|'),
        fooSubStoreString: fooSubStoreString.join('|'),
      }
    }

    it('should initial record', () => {
      // observed
      expect(record()).toEqual({
        fooBy2ndIndexJson: 'foo:C',
        fooBy2ndIndexString: 'C',
        fooByCAttributeJson: 'foo:C',
        fooByCAttributeString: 'C',
        fooSubStoreJson: 'foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should update foo..., if insert by replace', () => {
      // execute
      update('foos', [{ foo: 'D' }, { foo: 'E' }, { foo: 'F' }])

      // observed
      expect(record()).toEqual({
        fooBy2ndIndexJson: 'foo:C|foo:F',
        fooBy2ndIndexString: 'C|F',
        fooByCAttributeJson: 'foo:C|',
        fooByCAttributeString: 'C|',
        fooSubStoreJson: 'foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should (not) update foo..., if insert by path', () => {
      // execute
      update('foos', store.foos.length, { foo: 'D' })

      // observed
      expect(record()).toEqual({
        fooBy2ndIndexJson: 'foo:C',
        fooBy2ndIndexString: 'C',
        fooByCAttributeJson: 'foo:C|foo:C',
        fooByCAttributeString: 'C|C',
        fooSubStoreJson: 'foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should update foo..., if remove by replace', () => {
      // execute
      update('foos', (foos) => [foos[0], foos[2]])

      // observed
      expect(record()).toEqual({
        fooBy2ndIndexJson: 'foo:C|',
        fooBy2ndIndexString: 'C|',
        fooByCAttributeJson: 'foo:C|foo:C',
        fooByCAttributeString: 'C|C',
        fooSubStoreJson: 'foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should update foo..., if remove by splice', () => {
      // execute
      update('foos', (foos) => {
        foos.splice(1, 1)
        return foos
      })

      // observed
      expect(record()).toEqual({
        fooBy2ndIndexJson: 'foo:C',
        fooBy2ndIndexString: 'C',
        fooByCAttributeJson: 'foo:C',
        fooByCAttributeString: 'C',
        fooSubStoreJson: 'foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should update inner of foo C (deep)', () => {
      // execute
      update('foos', 2, 'baz', 'BAZ')

      // observed
      expect(record()).toEqual({
        fooBy2ndIndexJson: 'foo:C|foo:C,baz:BAZ',
        fooBy2ndIndexString: 'C',
        fooByCAttributeJson: 'foo:C|foo:C,baz:BAZ',
        fooByCAttributeString: 'C',
        fooSubStoreJson: 'foo:C|foo:C,baz:BAZ',
        fooSubStoreString: 'C',
      })
    })

    it('should update inner of foo C (flat)', () => {
      // execute
      subUpdate('baz', 'BAZ')

      // observed
      expect(record()).toEqual({
        fooBy2ndIndexJson: 'foo:C|foo:C,baz:BAZ',
        fooBy2ndIndexString: 'C',
        fooByCAttributeJson: 'foo:C|foo:C,baz:BAZ',
        fooByCAttributeString: 'C',
        fooSubStoreJson: 'foo:C|foo:C,baz:BAZ',
        fooSubStoreString: 'C',
      })
    })

    it('should update inner of foo C after remove (flat)', () => {
      // execute
      update('foos', (foos) => [foos[0], foos[1]])
      subUpdate('baz', 'BAZ')

      // observed
      expect(record()).toEqual({
        fooBy2ndIndexJson: 'foo:C|',
        fooBy2ndIndexString: 'C|',
        fooByCAttributeJson: 'foo:C|',
        fooByCAttributeString: 'C|',
        fooSubStoreJson: 'foo:C|foo:C,baz:BAZ',
        fooSubStoreString: 'C',
      })
    })

    it('should update inner after complete update foo C', () => {
      // execute
      update('foos', 2, { foo: 'X', baz: 'Bla' })

      // observed
      expect(record()).toEqual({
        fooBy2ndIndexJson: 'foo:C|foo:X,baz:Bla',
        fooBy2ndIndexString: 'C|X',
        fooByCAttributeJson: 'foo:C|',
        fooByCAttributeString: 'C|',
        fooSubStoreJson: 'foo:C|foo:X,baz:Bla',
        fooSubStoreString: 'C|X',
      })
    })

    it('should update inner with undefined', () => {
      // execute
      update('foos', 2, () => ({ baz: 'Baz' }))
      update('foos', 2, () => ({ baz: undefined }))

      // observed
      expect(record()).toEqual({
        fooBy2ndIndexJson: 'foo:C|foo:C,baz:Baz|foo:C',
        fooBy2ndIndexString: 'C',
        fooByCAttributeJson: 'foo:C|foo:C,baz:Baz|foo:C',
        fooByCAttributeString: 'C',
        fooSubStoreJson: 'foo:C|foo:C,baz:Baz|foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should update complete array element', () => {
      // execute
      update('foos', 2, () => ({ baz: 'Baz' }))
      update('foos', { 2: { foo: 'C' } })

      // observed
      expect(record()).toEqual({
        fooBy2ndIndexJson: 'foo:C|foo:C,baz:Baz|foo:C',
        fooBy2ndIndexString: 'C|C',
        fooByCAttributeJson: 'foo:C|foo:C,baz:Baz|foo:C',
        fooByCAttributeString: 'C|C',
        fooSubStoreJson: 'foo:C|foo:C,baz:Baz',
        fooSubStoreString: 'C',
      })
    })
  })

  describe('object of complex objects', () => {
    type Foo = { foo: string; baz?: string }
    type FooStore = { foos: { [id: string]: Foo } }

    let dispose: () => void

    let store: Store<FooStore>
    let update: SetStoreFunction<FooStore>

    let subStore: Store<Foo>
    let subUpdate: SetStoreFunction<Foo>

    let fooByCKeyJson: string[]
    let fooByCKeyString: string[]
    let fooByCAttributeJson: string[]
    let fooByCAttributeString: string[]
    let fooSubStoreJson: string[]
    let fooSubStoreString: string[]

    beforeEach(() => {
      fooByCKeyJson = []
      fooByCKeyString = []
      fooByCAttributeJson = []
      fooByCAttributeString = []
      fooSubStoreJson = []
      fooSubStoreString = []

      const asJson = (f: Foo | undefined) => {
        if (!f) return ''
        return Object.entries(f)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}:${v}`)
          .join(',')
      }

      createRoot((d) => {
        dispose = d
        ;[store, update] = createStore<FooStore>({ foos: { a: { foo: 'A' }, b: { foo: 'B' }, c: { foo: 'C' } } })
        createEffect(() => fooByCKeyJson.push(asJson(store.foos.c)))
        createEffect(() => fooByCKeyString.push(store.foos.c?.foo))
        createEffect(() => fooByCAttributeJson.push(asJson(Object.values(store.foos).find((f) => f.foo === 'C'))))
        createEffect(() => fooByCAttributeString.push(Object.values(store.foos).find((f) => f.foo === 'C')?.foo ?? ''))
        ;[subStore, subUpdate] = createStore<Foo>(store.foos.c)
        createEffect(() => fooSubStoreJson.push(asJson(subStore)))
        createEffect(() => fooSubStoreString.push(subStore.foo))
      })
    })

    afterEach(() => {
      dispose?.()
    })

    function record() {
      return {
        fooByCAttributeJson: fooByCAttributeJson.join('|'),
        fooByCAttributeString: fooByCAttributeString.join('|'),
        fooByCKeyJson: fooByCKeyJson.join('|'),
        fooByCKeyString: fooByCKeyString.join('|'),
        fooSubStoreJson: fooSubStoreJson.join('|'),
        fooSubStoreString: fooSubStoreString.join('|'),
      }
    }

    it('should initial record', () => {
      // observed
      expect(record()).toEqual({
        fooByCAttributeJson: 'foo:C',
        fooByCAttributeString: 'C',
        fooByCKeyJson: 'foo:C',
        fooByCKeyString: 'C',
        fooSubStoreJson: 'foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should update foo..., if insert by replace', () => {
      // execute
      update('foos', { d: { foo: 'D' }, e: { foo: 'E' }, f: { foo: 'F' } })

      // observed
      expect(record()).toEqual({
        fooByCAttributeJson: 'foo:C|foo:C',
        fooByCAttributeString: 'C|C',
        fooByCKeyJson: 'foo:C',
        fooByCKeyString: 'C',
        fooSubStoreJson: 'foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should (not) update foo..., if insert by path', () => {
      // execute
      update('foos', 'd', { foo: 'D' })

      // observed
      expect(record()).toEqual({
        fooByCAttributeJson: 'foo:C|foo:C',
        fooByCAttributeString: 'C|C',
        fooByCKeyJson: 'foo:C',
        fooByCKeyString: 'C',
        fooSubStoreJson: 'foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should update foo..., if remove by undefined at path', () => {
      // execute
      update('foos', 'c', undefined as any)

      // observed
      expect(record()).toEqual({
        fooByCAttributeJson: 'foo:C|',
        fooByCAttributeString: 'C|',
        fooByCKeyJson: 'foo:C|',
        fooByCKeyString: 'C|',
        fooSubStoreJson: 'foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should update foo..., if remove by delete', () => {
      // execute
      update('foos', (foos) => {
        // eslint-disable-next-line no-param-reassign
        delete foos.c
        return foos
      })

      // observed
      expect(record()).toEqual({
        fooByCAttributeJson: 'foo:C',
        fooByCAttributeString: 'C',
        fooByCKeyJson: 'foo:C',
        fooByCKeyString: 'C',
        fooSubStoreJson: 'foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should update foo..., if remove by undefined', () => {
      // execute
      update('foos', (foos) => ({ ...foos, c: undefined }))

      // observed
      expect(record()).toEqual({
        fooByCAttributeJson: 'foo:C|',
        fooByCAttributeString: 'C|',
        fooByCKeyJson: 'foo:C|',
        fooByCKeyString: 'C|',
        fooSubStoreJson: 'foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should update foo..., if remove by partial undefined', () => {
      // execute
      update('foos', { c: undefined })

      // observed
      expect(record()).toEqual({
        fooByCAttributeJson: 'foo:C|',
        fooByCAttributeString: 'C|',
        fooByCKeyJson: 'foo:C|',
        fooByCKeyString: 'C|',
        fooSubStoreJson: 'foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should update inner of foo C (deep)', () => {
      // execute
      update('foos', 'c', 'baz', 'BAZ')

      // observed
      expect(record()).toEqual({
        fooByCKeyJson: 'foo:C|foo:C,baz:BAZ',
        fooByCKeyString: 'C',
        fooByCAttributeJson: 'foo:C|foo:C,baz:BAZ',
        fooByCAttributeString: 'C',
        fooSubStoreJson: 'foo:C|foo:C,baz:BAZ',
        fooSubStoreString: 'C',
      })
    })

    it('should update inner of foo C (flat)', () => {
      // execute
      subUpdate('baz', 'BAZ')

      // observed
      expect(record()).toEqual({
        fooByCKeyJson: 'foo:C|foo:C,baz:BAZ',
        fooByCKeyString: 'C',
        fooByCAttributeJson: 'foo:C|foo:C,baz:BAZ',
        fooByCAttributeString: 'C',
        fooSubStoreJson: 'foo:C|foo:C,baz:BAZ',
        fooSubStoreString: 'C',
      })
    })

    it('should update inner of foo C after remove (flat)', () => {
      // execute
      update('foos', { c: undefined })
      subUpdate('baz', 'BAZ')

      // observed
      expect(record()).toEqual({
        fooByCKeyJson: 'foo:C|',
        fooByCKeyString: 'C|',
        fooByCAttributeJson: 'foo:C|',
        fooByCAttributeString: 'C|',
        fooSubStoreJson: 'foo:C|foo:C,baz:BAZ',
        fooSubStoreString: 'C',
      })
    })

    it('should update inner after complete update foo C', () => {
      // execute
      update('foos', 'c', { foo: 'X', baz: 'Bla' })

      // observed
      expect(record()).toEqual({
        fooByCKeyJson: 'foo:C|foo:X,baz:Bla',
        fooByCKeyString: 'C|X',
        fooByCAttributeJson: 'foo:C|',
        fooByCAttributeString: 'C|',
        fooSubStoreJson: 'foo:C|foo:X,baz:Bla',
        fooSubStoreString: 'C|X',
      })
    })

    it('should update inner with undefined', () => {
      // execute
      update('foos', 'c', () => ({ baz: 'Baz' }))
      update('foos', 'c', () => ({ baz: undefined }))

      // observed
      expect(record()).toEqual({
        fooByCKeyJson: 'foo:C|foo:C,baz:Baz|foo:C',
        fooByCKeyString: 'C',
        fooByCAttributeJson: 'foo:C|foo:C,baz:Baz|foo:C',
        fooByCAttributeString: 'C',
        fooSubStoreJson: 'foo:C|foo:C,baz:Baz|foo:C',
        fooSubStoreString: 'C',
      })
    })

    it('should update complete object value', () => {
      // execute
      update('foos', 'c', () => ({ baz: 'Baz' }))
      update('foos', { c: { foo: 'C' } })

      // observed
      expect(record()).toEqual({
        fooByCKeyJson: 'foo:C|foo:C,baz:Baz|foo:C',
        fooByCKeyString: 'C|C',
        fooByCAttributeJson: 'foo:C|foo:C,baz:Baz|foo:C',
        fooByCAttributeString: 'C|C',
        fooSubStoreJson: 'foo:C|foo:C,baz:Baz',
        fooSubStoreString: 'C',
      })
    })
  })
})
