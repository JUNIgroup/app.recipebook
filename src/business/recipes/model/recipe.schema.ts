import { JSONSchemaType, validation } from '../../helper/validation/validation-helper'
import { Recipe, RecipeV1 } from './recipe.model'

const recipeSchemaV1: JSONSchemaType<RecipeV1> = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 },
    version: { type: 'number', const: 1 },
    creator: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1 },
    subtitle: { type: 'string', nullable: true },
    origin: {
      type: 'object',
      nullable: true,
      properties: {
        uri: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
      },
      additionalProperties: false,
      required: [],
    },
  },
  additionalProperties: false,
  required: ['id', 'version', 'creator', 'title'],
}

export const recipeSchema = recipeSchemaV1

export const isRecipe = validation.compile(recipeSchema)

/** Convert each supported version of recipe to the latest version. */
export function upgradeRecipe(recipe: RecipeV1): Recipe {
  return recipe
}
