// import { JSONSchemaType, validation } from '../../helper/validation/validation-helper'
import { validate as validateRecipe } from './recipe.json-schema'
import { Recipe, RecipeV1 } from './recipe.model'

export function isRecipe(data: unknown): data is Recipe {
  const valid = validateRecipe(data)
  return valid
}

/** Convert each supported version of recipe to the latest version. */
export function upgradeRecipe(recipe: RecipeV1): Recipe {
  return recipe
}
