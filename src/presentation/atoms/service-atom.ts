import { atom, PrimitiveAtom } from 'jotai'

export type ServiceAtom<T> = PrimitiveAtom<T> & {
  setup: (value: T) => [PrimitiveAtom<T | null>, T]
}

/**
 * Creates a Atom, force to provide the service.
 *
 * @Examples
 * ```
 * const FooBarAtom = serviceAtom<'Foo' | 'Bar'>()
 * <Provider initialValues={[FooBarAtom, 'Foo']]}>{children}</Provider>
 * ```
 */
export const serviceAtom = <T>() => {
  const valueAtom = atom<T | null>(null)
  const accessAtom = atom<T>((get) => {
    const service = get(valueAtom)
    if (service === null) throw Error('Missing atom context. Service not defined')
    return service
  }) as ServiceAtom<T>
  accessAtom.setup = (value) => [valueAtom, value]
  return accessAtom
}
