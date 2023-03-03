// import { JSONSchemaType, validation } from '../../helper/validation/validation-helper'
import { Infer, literal, nonempty, object, optional, string, is } from 'superstruct'
import { nonArray } from '../../../infrastructure/validation/superstruct.extend'

const RecipeV1Struct = nonArray(
  object({
    // --- meta data ---
    id: nonempty(string()),
    version: literal(1),
    creator: nonempty(string()),
    // --- content ---
    title: nonempty(string()),
    subtitle: optional(string()),
    origin: optional(
      nonArray(
        object({
          uri: optional(string()),
          description: optional(string()),
        }),
      ),
    ),
  }),
)

export type RecipeV1 = Infer<typeof RecipeV1Struct>

export function isRecipeV1(data: unknown): data is RecipeV1 {
  const valid = is(data, RecipeV1Struct)
  return valid
}
