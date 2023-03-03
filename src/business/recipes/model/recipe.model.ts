import { isRecipeV1, RecipeV1 } from './recipe.v1.schema'

/** Alias for the latest version of recipe */
export type Recipe = RecipeV1

export const ModelVersion = 1

export const isRecipe = isRecipeV1

/** Convert each supported version of recipe to the latest version. */
export function upgradeRecipe(recipe: RecipeV1): Recipe {
  return recipe
}
