export type RecipeV1 = {
  // --- meta data ---
  id: string
  version: 1
  creator: string
  // --- content ---
  title: string
  subtitle?: string
  origin?: {
    uri?: string
    description?: string
  }
}

/** Alias for the latest version of recipe */
export type Recipe = RecipeV1

export const ModelVersion = 1

/** Convert each supported version of recipe to the latest version. */
export function upgradeRecipe(recipe: RecipeV1): Recipe {
  return recipe
}
