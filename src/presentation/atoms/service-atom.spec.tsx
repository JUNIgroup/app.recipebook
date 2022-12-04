// @vitest-environment happy-dom

import { renderHook } from '@testing-library/react-hooks'
import { Provider, useAtomValue } from 'jotai'
import { atomWithDefault } from 'jotai/utils'
import { PropsWithChildren } from 'react'
import { serviceAtom } from './service-atom'

describe('serviceAtom', () => {
  it('should return service if service is provided directly', () => {
    // arrange
    const FooBarAtom = serviceAtom<'Foo' | 'Bar'>()
    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider initialValues={[[FooBarAtom, 'Foo']]}>{children}</Provider>
    )

    // act
    const { result } = renderHook(() => useAtomValue(FooBarAtom), { wrapper })

    // assert
    expect(result.current).toBe('Foo')
  })

  it('should return direct service if service is provided derived', () => {
    // arrange
    const FooAtom = serviceAtom<'Foo'>()
    const FooBarAtom = atomWithDefault<string>((get) => `${get(FooAtom)}Bar`)
    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider initialValues={[[FooAtom, 'Foo']]}>{children}</Provider>
    )

    // act
    const { result } = renderHook(() => useAtomValue(FooBarAtom), { wrapper })

    // assert
    expect(result.current).toBe('FooBar')
  })

  it('should throw an error if service is not provided, ', () => {
    // arrange
    const FooBarAtom = serviceAtom<'Foo' | 'Bar'>()

    // act
    const { result } = renderHook(() => useAtomValue(FooBarAtom))

    // assert
    expect(result.error).toBeDefined()
  })
})
