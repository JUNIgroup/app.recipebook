import { Draft } from '@reduxjs/toolkit'

export function castDraft<T>(value: T): Draft<T> {
  return value as Draft<T>
}

export type WritableDraft<T> = { -readonly [K in keyof T]: Draft<T[K]> }
