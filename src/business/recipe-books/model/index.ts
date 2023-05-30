import { isRecipeBookV1, RecipeBookV1 } from './recipe-book.v1.schema'
import { isRecipeV1, RecipeV1 } from './recipe.v1.schema'

/** Alias for the latest version of recipe */
export type Recipe = RecipeV1

/** Alias for the latest version of recipe book */
export type RecipeBook = RecipeBookV1

/** Version of the RecipeBook */
export const ModelVersion = 1

export const isRecipeBook = isRecipeBookV1

export const isRecipe = isRecipeV1
