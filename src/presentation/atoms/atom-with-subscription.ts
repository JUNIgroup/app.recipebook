import { atom, Getter } from 'jotai'

export type InitialValue<Value> = (get: Getter) => Value

export type Unsubscribe = () => void
export type Subscriber<T> = (value: T) => void
export type Subscription<T> = (subscriber: Subscriber<T>, get: Getter) => Unsubscribe

export const atomWithSubscription = <T>(initialValue: InitialValue<T>, subscription: Subscription<T>) => {
  const subscriptionAtom = atom((get) => {
    const initialResult = initialValue(get)
    const resultAtom = atom(initialResult)
    resultAtom.onMount = (update) => subscription((value) => update(value), get)
    return resultAtom
  })

  const observableAtom = atom((get) => get(get(subscriptionAtom)))
  return observableAtom
}
