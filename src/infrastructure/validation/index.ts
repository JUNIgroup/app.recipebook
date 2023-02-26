import type { ErrorObject } from 'ajv'

export type { ErrorObject }

export type ValidateFunction<T> = {
  (data: unknown): data is T
  errors?: null | ErrorObject[]
}
