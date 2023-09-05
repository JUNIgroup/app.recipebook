/* eslint-disable no-underscore-dangle */
/* eslint-disable solid/reactivity */

import { createEffect, createRoot } from 'solid-js'
import { ReconcileOptions, SetStoreFunction, Store, createStore, reconcile } from 'solid-js/store'

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
      update('foos', 'c', undefined as unknown as Foo)

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

      expect(record()).toMatchObject({
        fooByCKeyJson: 'foo:C|foo:C,baz:Baz|foo:C',
      })
    })
  })

  describe('reconcile', () => {
    type Doc = {
      _id: string
      foo: string
      hints: {
        _id: string
        bar: string
      }[]
      tags: string[]
    }
    type DocStore = { docs: { [id: string]: Doc } }

    let dispose: () => void

    let store: Store<DocStore>
    let update: SetStoreFunction<DocStore>

    let cDocAllJson: string[]
    let cDocFooString: string[]
    let cDocHintH1Json: string[]
    let cDocTagsJson: string[]
    let cDocTag1stString: string[]

    beforeEach(() => {
      cDocAllJson = []
      cDocFooString = []
      cDocHintH1Json = []
      cDocTagsJson = []
      cDocTag1stString = []

      const asJson = <T>(obj: T | undefined): string => {
        if (!obj) return ''
        if (Array.isArray(obj)) return obj.map(asJson).join(',')
        if (typeof obj !== 'object') return `${obj}`
        return Object.entries(obj)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}:${asJson(v)}`)
          .join(',')
      }

      createRoot((d) => {
        dispose = d
        ;[store, update] = createStore({ docs: {} })
        createEffect(() => cDocAllJson.push(asJson(store.docs.c)))
        createEffect(() => cDocFooString.push(store.docs.c?.foo))
        createEffect(() => cDocHintH1Json.push(asJson(store.docs.c?.hints.find((h) => h._id === 'H1'))))
        createEffect(() => cDocTagsJson.push(asJson(store.docs.c?.tags)))
        createEffect(() => cDocTag1stString.push(store.docs.c?.tags[0]))
      })
    })

    afterEach(() => {
      dispose?.()
    })

    function record() {
      return {
        cDocAllJson: cDocAllJson.join('|'),
        cDocFooString: cDocFooString.join('|'),
        cDocHintH1Json: cDocHintH1Json.join('|'),
        cDocTag1stString: cDocTag1stString.join('|'),
        cDocTagsJson: cDocTagsJson.join('|'),
      }
    }

    it('should initial have an empty record', () => {
      // observed
      expect(record()).toEqual({
        cDocAllJson: '',
        cDocFooString: '',
        cDocHintH1Json: '',
        cDocTag1stString: '',
        cDocTagsJson: '',
      })
    })

    it('should initial fill doc c', () => {
      // execute
      const options: ReconcileOptions = { key: '_id', merge: true }
      const doc0 = { _id: 'c', foo: 'X', hints: [{ _id: 'H1', bar: 'Bla' }], tags: ['1st', '2nd'] }
      update('docs', 'c', reconcile(doc0, options))

      // observed
      expect(record()).toEqual({
        cDocAllJson: '|_id:c,foo:X,hints:_id:H1,bar:Bla,tags:1st,2nd',
        cDocFooString: '|X',
        cDocHintH1Json: '|_id:H1,bar:Bla',
        cDocTag1stString: '|1st',
        cDocTagsJson: '|1st,2nd',
      })
    })

    it('should update doc c (foo change)', () => {
      // execute
      const options: ReconcileOptions = { key: '_id', merge: true }
      const doc0 = {
        _id: 'c', //
        foo: 'X',
        hints: [{ _id: 'H1', bar: 'Bla' }],
        tags: ['1st', '2nd'],
      }
      const doc1 = {
        _id: 'c',
        foo: 'Y',
        hints: [{ _id: 'H1', bar: 'Bla' }],
        tags: ['1st', '2nd'],
      }
      update('docs', 'c', reconcile(doc0, options))
      update('docs', 'c', reconcile(doc1, options))

      // observed
      expect(record()).toEqual({
        cDocAllJson: '|_id:c,foo:X,hints:_id:H1,bar:Bla,tags:1st,2nd|_id:c,foo:Y,hints:_id:H1,bar:Bla,tags:1st,2nd',
        cDocFooString: '|X|Y',
        cDocHintH1Json: '|_id:H1,bar:Bla',
        cDocTag1stString: '|1st',
        cDocTagsJson: '|1st,2nd',
      })
    })

    it('should update doc c (tags change)', () => {
      // execute
      const options: ReconcileOptions = { key: '_id', merge: true }
      const doc0 = {
        _id: 'c', //
        foo: 'X',
        hints: [{ _id: 'H1', bar: 'Bla' }],
        tags: ['1st', '2nd'],
      }
      const doc1 = {
        _id: 'c',
        foo: 'X',
        hints: [{ _id: 'H1', bar: 'Bla' }],
        tags: ['first', 'second'],
      }
      update('docs', 'c', reconcile(doc0, options))
      update('docs', 'c', reconcile(doc1, options))

      // observed
      expect(record()).toEqual({
        cDocAllJson:
          '|_id:c,foo:X,hints:_id:H1,bar:Bla,tags:1st,2nd|_id:c,foo:X,hints:_id:H1,bar:Bla,tags:first,second',
        cDocFooString: '|X',
        cDocHintH1Json: '|_id:H1,bar:Bla',
        cDocTag1stString: '|1st|first',
        cDocTagsJson: '|1st,2nd|first,second',
      })
    })

    it('should update doc c (hint change)', () => {
      // execute
      const options: ReconcileOptions = { key: '_id', merge: true }
      const doc0 = {
        _id: 'c', //
        foo: 'X',
        hints: [{ _id: 'H1', bar: 'Bla' }],
        tags: ['1st', '2nd'],
      }
      const doc1 = {
        _id: 'c',
        foo: 'X',
        hints: [{ _id: 'H1', bar: 'One' }],
        tags: ['1st', '2nd'],
      }
      update('docs', 'c', reconcile(doc0, options))
      update('docs', 'c', reconcile(doc1, options))

      // observed
      expect(record()).toEqual({
        cDocAllJson: '|_id:c,foo:X,hints:_id:H1,bar:Bla,tags:1st,2nd|_id:c,foo:X,hints:_id:H1,bar:One,tags:1st,2nd',
        cDocFooString: '|X',
        cDocHintH1Json: '|_id:H1,bar:Bla|_id:H1,bar:One',
        cDocTag1stString: '|1st',
        cDocTagsJson: '|1st,2nd',
      })
    })

    it('should update doc c (hint prepend)', () => {
      // execute
      const options: ReconcileOptions = { key: '_id', merge: true }
      const doc0 = {
        _id: 'c', //
        foo: 'X',
        hints: [{ _id: 'H1', bar: 'Bla' }],
        tags: ['1st', '2nd'],
      }
      const doc1 = {
        _id: 'c',
        foo: 'X',
        hints: [
          { _id: 'H0', bar: 'zero' },
          { _id: 'H1', bar: 'Bla' },
        ],
        tags: ['1st', '2nd'],
      }
      update('docs', 'c', reconcile(doc0, options))
      update('docs', 'c', reconcile(doc1, options))

      // observed
      expect(record()).toEqual({
        cDocAllJson:
          '|_id:c,foo:X,hints:_id:H1,bar:Bla,tags:1st,2nd|_id:c,foo:X,hints:_id:H0,bar:zero,_id:H1,bar:Bla,tags:1st,2nd',
        cDocFooString: '|X',
        cDocHintH1Json: '|_id:H1,bar:Bla|_id:H1,bar:Bla',
        cDocTag1stString: '|1st',
        cDocTagsJson: '|1st,2nd',
      })
    })
  })
})
