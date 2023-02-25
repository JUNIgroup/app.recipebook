import { Recipe, RecipeV1 } from './recipe.model'

export const testUserId = 'id-test-0001'

export const fullRecipeV1: RecipeV1 = Object.freeze({
  id: 'test-1',
  version: 1,
  creator: testUserId,
  title: 'test-title',
  subtitle: 'test-subtitle',
  origin: {
    uri: 'https://example.com/test-1',
    description: 'test-origin',
  },
})

export const fullRecipe: Recipe = fullRecipeV1
