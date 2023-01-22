import { selectAllRecipes, selectAllRecipesSortedByName, selectRecipeCount, selectRecipeById } from './recipe.selectors'
import { RecipesState } from './recipe.slice'
import { fullRecipe } from '../model/recipes.samples'

describe('selectRecipeCount', () => {
  it('should return 0 if no recipe is stored', () => {
    const recipes: RecipesState = {
      ids: [],
      entities: {},
    }
    expect(selectRecipeCount({ recipes })).toBe(0)
  })

  it('should return N if N recipes are stored', () => {
    const recipe1 = { ...fullRecipe, id: 'recipe1' }
    const recipe2 = { ...fullRecipe, id: 'recipe2' }
    const recipe3 = { ...fullRecipe, id: 'recipe3' }
    const recipes: RecipesState = {
      ids: [recipe1.id, recipe2.id, recipe3.id],
      entities: { recipe1, recipe2, recipe3 },
    }
    expect(selectRecipeCount({ recipes })).toBe(3)
  })
})

describe('selectAllRecipes', () => {
  it('should return empty array if no recipe is stored', () => {
    const recipes: RecipesState = {
      ids: [],
      entities: {},
    }
    expect(selectAllRecipes({ recipes })).toEqual([])
  })

  it('should return recipes in definition order', () => {
    const recipe1 = { ...fullRecipe, id: 'recipe1' }
    const recipe2 = { ...fullRecipe, id: 'recipe2' }
    const recipe3 = { ...fullRecipe, id: 'recipe3' }
    const recipes: RecipesState = {
      ids: [recipe2.id, recipe1.id, recipe3.id],
      entities: { recipe2, recipe1, recipe3 },
    }
    expect(selectAllRecipes({ recipes })).toEqual([recipe2, recipe1, recipe3])
  })
})

describe('selectAllRecipesSortedByName', () => {
  it('should return empty array if no recipe is stored', () => {
    const recipes: RecipesState = {
      ids: [],
      entities: {},
    }
    expect(selectAllRecipesSortedByName({ recipes })).toEqual([])
  })

  it('should return recipes in alphabetic order by title', () => {
    const recipe1 = { ...fullRecipe, id: 'recipe1', title: 'b' }
    const recipe2 = { ...fullRecipe, id: 'recipe2', title: 'a' }
    const recipe3 = { ...fullRecipe, id: 'recipe3', title: 'c' }
    const recipes: RecipesState = {
      ids: [recipe1.id, recipe2.id, recipe3.id],
      entities: { recipe1, recipe2, recipe3 },
    }
    expect(selectAllRecipesSortedByName({ recipes })).toEqual([recipe2, recipe1, recipe3])
  })
})

describe('selectRecipeById', () => {
  it('should return null if ID is unknown', () => {
    const recipes: RecipesState = {
      ids: [],
      entities: {},
    }
    expect(selectRecipeById({ recipes }, 'unknown-id')).toBeNull()
  })

  it('should return recipe with given id', () => {
    const recipe1 = { ...fullRecipe, id: 'recipe1', title: 'b' }
    const recipe2 = { ...fullRecipe, id: 'recipe2', title: 'a' }
    const recipe3 = { ...fullRecipe, id: 'recipe3', title: 'c' }
    const recipes: RecipesState = {
      ids: [recipe1.id, recipe2.id, recipe3.id],
      entities: { recipe1, recipe2, recipe3 },
    }
    expect(selectRecipeById({ recipes }, recipe2.id)).toEqual(recipe2)
  })
})
