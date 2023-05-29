import { Recipe, RecipeBook } from '.'
import { RecipeBookV1 } from './recipe-book.v1.schema'
import { RecipeV1 } from './recipe.v1.schema'

export const fullRecipeBookV1: RecipeBookV1 = Object.freeze({
  id: 'test-rb-1',
  version: 1,
  rev: 4,
  title: 'recipe-book-1',
  subtitle: 'test-data',
  recipes: ['test-r-1'],
})

export const fullRecipeV1: RecipeV1 = Object.freeze({
  id: 'test-r-1',
  rev: 1,
  title: 'recipe-1',
  subtitle: 'test-data',
  origin: {
    uri: 'https://example.com/test-1',
    description: 'test-origin',
  },
})

export const fullRecipeBook: RecipeBook = fullRecipeBookV1
export const fullRecipe: Recipe = fullRecipeV1
