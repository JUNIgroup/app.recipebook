// @vitest-environment happy-dom

import { act, renderHook } from '@testing-library/react'
import { atom, useAtomValue } from 'jotai'
import { atomWithSubscription, Subscriber, Subscription } from './atom-with-subscription'

// export type InitialValue<Value> = (get: Getter) => Value
// export type Unsubscribe = () => void
// export type Subscriber<T> = (value: T) => void
// export type Subscription<T> = (subscriber: Subscriber<T>, get: Getter) => Unsubscribe

// export const atomWithSubscription = <T>(initialValue: InitialValue<T>, subscription: Subscription<T>) => {
//   const subscriptionAtom = atom((get) => {
//     const initialResult = initialValue(get)
//     const resultAtom = atom(initialResult)
//     resultAtom.onMount = (update) => subscription((value) => update(value), get)
//     return resultAtom
//   })

//   const observableAtom = atom((get) => get(get(subscriptionAtom)))
//   return observableAtom
// }

describe('atomWithSubscription', () => {
  it('should subscribe', () => {
    // arrange
    let subscriber: Subscriber<number> | undefined
    const subscription: Subscription<number> = (sub) => {
      subscriber = sub
      return () => {}
    }
    const SubscriptionAtom = atomWithSubscription(() => 100, subscription)

    // act
    renderHook(() => useAtomValue(SubscriptionAtom))

    // assert
    expect(subscriber).toBeDefined()
  })

  it('should unsubscribe', () => {
    // arrange
    let subscriber: Subscriber<number> | undefined
    const subscription: Subscription<number> = (sub) => {
      subscriber = sub
      return () => {
        subscriber = undefined
      }
    }
    const SubscriptionAtom = atomWithSubscription(() => 100, subscription)

    // act
    const { unmount } = renderHook(() => useAtomValue(SubscriptionAtom))
    unmount()

    // assert
    expect(subscriber).toBeUndefined()
  })

  describe('directly - not derived', () => {
    it('should return initialValue', () => {
      // arrange
      const subscription = vi.fn()
      const SubscriptionAtom = atomWithSubscription(() => 100, subscription)

      // act
      const { result } = renderHook(() => useAtomValue(SubscriptionAtom))

      // assert
      expect(result.current).toBe(100)
    })

    it('should return subscription value', () => {
      // arrange
      let subscriber: Subscriber<number> | undefined
      const subscription: Subscription<number> = (sub) => {
        subscriber = sub
        return () => {}
      }
      const SubscriptionAtom = atomWithSubscription(() => 100, subscription)

      // act
      const { result } = renderHook(() => useAtomValue(SubscriptionAtom))
      act(() => subscriber?.(200))

      // assert
      expect(result.current).toBe(200)
    })
  })

  describe('derived', () => {
    it('should return initialValue', () => {
      // arrange
      const BaseAtom = atom(42)
      const subscription = vi.fn()
      const SubscriptionAtom = atomWithSubscription((get) => get(BaseAtom), subscription)

      // act
      const { result } = renderHook(() => useAtomValue(SubscriptionAtom))

      // assert
      expect(result.current).toBe(42)
    })

    it('should return subscription value', () => {
      // arrange
      const BaseAtom = atom(42)
      let subscriber: Subscriber<number> | undefined
      let base: number
      const subscription: Subscription<number> = (sub, get) => {
        base = get(BaseAtom)
        subscriber = sub
        return () => {}
      }
      const SubscriptionAtom = atomWithSubscription(() => 100, subscription)

      // act
      const { result } = renderHook(() => useAtomValue(SubscriptionAtom))
      act(() => subscriber?.(base * 2))

      // assert
      expect(result.current).toBe(84)
    })
  })
})
