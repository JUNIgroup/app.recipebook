// import { JSONSchemaType, validation } from '../../helper/validation/validation-helper'
import { Infer, literal, nonempty, object, optional, string, is, number, array } from 'superstruct'
import { nonArray } from '../../../infrastructure/validation/superstruct.extend'

const RecipeBookV1Struct = nonArray(
  object({
    // --- meta data ---
    id: nonempty(string()),
    rev: number(),
    version: literal(1),
    // --- content ---
    title: nonempty(string()),
    subtitle: optional(string()),
    // --- references ---
    recipes: array(string()),
  }),
)

export type RecipeBookV1 = Infer<typeof RecipeBookV1Struct>

export function isRecipeBookV1(data: unknown): data is RecipeBookV1 {
  const valid = is(data, RecipeBookV1Struct)
  return valid
}
