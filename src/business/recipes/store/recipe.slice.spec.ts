import { Recipe, ModelVersion } from '../model/recipe.model'
import { actions, recipesReducer, RecipesState } from './recipe.slice'

function createRecipe(id: string, title?: string): Recipe {
  return {
    id,
    version: ModelVersion,
    creator: 'tester',
    title: title ?? `Recipe ${id}`,
  }
}

describe('recipesSlice', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return the initial state', () => {
    const initialState = recipesReducer(undefined, { type: undefined })
    expect(initialState).toEqual({ ids: [], entities: {} })
  })

  describe('setAllRecipes', () => {
    it('should set recipes in an empty store', () => {
      // arrange
      const recipeA = createRecipe('a')
      const recipeB = createRecipe('b')
      const recipeC = createRecipe('c')
      const previousState: RecipesState = { ids: [], entities: {} }
      const action = actions.setAllRecipes({ recipes: [recipeC, recipeA, recipeB] })
      const expectedState: RecipesState = { ids: ['c', 'a', 'b'], entities: { c: recipeC, a: recipeA, b: recipeB } }

      // act
      const actualState = recipesReducer(previousState, action)

      // assert
      expect(actualState).toEqual(expectedState)
    })

    it('should replace all recipes in an filled store', () => {
      // arrange
      const recipeA = createRecipe('a')
      const recipeB = createRecipe('b')
      const recipeC = createRecipe('c')
      const recipeX = createRecipe('x')
      const recipeY = createRecipe('y')
      const previousState: RecipesState = { ids: ['x', 'y'], entities: { x: recipeX, y: recipeY } }
      const action = actions.setAllRecipes({ recipes: [recipeC, recipeA, recipeB] })
      const expectedState: RecipesState = { ids: ['c', 'a', 'b'], entities: { c: recipeC, a: recipeA, b: recipeB } }

      // act
      const actualState = recipesReducer(previousState, action)

      // assert
      expect(actualState).toEqual(expectedState)
    })

    it('should skip for duplicate IDs', () => {
      // arrange
      const recipeA = createRecipe('a')
      const recipeB = createRecipe('b')
      const recipeX = createRecipe('x')
      const recipeY = createRecipe('y')
      const state: RecipesState = { ids: ['x', 'y'], entities: { x: recipeX, y: recipeY } }
      const action = actions.setAllRecipes({ recipes: [recipeB, recipeA, recipeB] })

      // act
      const actualState = recipesReducer(state, action)

      // assert
      expect(actualState).toBe(state)
    })
  })

  describe('addRecipe', () => {
    it('should add recipe to an empty store', () => {
      // arrange
      const recipeA = createRecipe('a')
      const previousState: RecipesState = { ids: [], entities: {} }
      const action = actions.addRecipe({ recipe: recipeA })
      const expectedState: RecipesState = { ids: ['a'], entities: { a: recipeA } }

      // act
      const actualState = recipesReducer(previousState, action)

      // assert
      expect(actualState).toEqual(expectedState)
    })

    it('should replace all recipes in an filled store', () => {
      // arrange
      const recipeA = createRecipe('a')
      const recipeX = createRecipe('x')
      const recipeY = createRecipe('y')
      const previousState: RecipesState = { ids: ['x', 'y'], entities: { x: recipeX, y: recipeY } }
      const action = actions.addRecipe({ recipe: recipeA })
      const expectedState: RecipesState = { ids: ['x', 'y', 'a'], entities: { x: recipeX, y: recipeY, a: recipeA } }

      // act
      const actualState = recipesReducer(previousState, action)

      // assert
      expect(actualState).toEqual(expectedState)
    })

    it('should skip if ID is already used', () => {
      // arrange
      const recipeX = createRecipe('x')
      const recipeY = createRecipe('y')
      const state: RecipesState = { ids: ['x', 'y'], entities: { x: recipeX, y: recipeY } }
      const action = actions.addRecipe({ recipe: recipeX })

      // act
      const actualState = recipesReducer(state, action)

      // assert
      expect(actualState).toBe(state)
    })
  })

  describe('updateRecipe', () => {
    it('should update an existing recipe', () => {
      // arrange
      const recipeA = createRecipe('a')
      const recipeX = createRecipe('x')
      const recipeY = createRecipe('y')
      const updatedA = createRecipe('a', 'New Title')
      const previousState: RecipesState = { ids: ['x', 'a', 'y'], entities: { x: recipeX, a: recipeA, y: recipeY } }
      const action = actions.updateRecipe({ recipe: updatedA })
      const expectedState: RecipesState = { ids: ['x', 'a', 'y'], entities: { x: recipeX, a: updatedA, y: recipeY } }

      // act
      const actualState = recipesReducer(previousState, action)

      // assert
      expect(actualState).toEqual(expectedState)
    })

    it('should skip if ID is unknown', () => {
      // arrange
      const recipeX = createRecipe('x')
      const recipeY = createRecipe('y')
      const updatedA = createRecipe('a', 'New Title')
      const state: RecipesState = { ids: ['x', 'y'], entities: { x: recipeX, y: recipeY } }
      const action = actions.updateRecipe({ recipe: updatedA })

      // act
      const actualState = recipesReducer(state, action)

      // assert
      expect(actualState).toBe(state)
    })
  })

  describe('removeRecipe', () => {
    it('should update an existing recipe', () => {
      // arrange
      const recipeA = createRecipe('a')
      const recipeX = createRecipe('x')
      const recipeY = createRecipe('y')
      const previousState: RecipesState = { ids: ['x', 'a', 'y'], entities: { x: recipeX, a: recipeA, y: recipeY } }
      const action = actions.removeRecipe({ id: 'a' })
      const expectedState: RecipesState = { ids: ['x', 'y'], entities: { x: recipeX, y: recipeY } }

      // act
      const actualState = recipesReducer(previousState, action)

      // assert
      expect(actualState).toEqual(expectedState)
    })

    it('should skip if ID is unknown', () => {
      // arrange
      const recipeX = createRecipe('x')
      const recipeY = createRecipe('y')
      const state: RecipesState = { ids: ['x', 'y'], entities: { x: recipeX, y: recipeY } }
      const action = actions.removeRecipe({ id: 'a' })

      // act
      const actualState = recipesReducer(state, action)

      // assert
      expect(actualState).toBe(state)
    })
  })

  describe('clear', () => {
    it('should remove all existing recipes', () => {
      // arrange
      const recipeX = createRecipe('x')
      const recipeY = createRecipe('y')
      const previousState: RecipesState = { ids: ['x', 'y'], entities: { x: recipeX, y: recipeY } }
      const action = actions.clearAllRecipes()
      const expectedState: RecipesState = { ids: [], entities: {} }

      // act
      const actualState = recipesReducer(previousState, action)

      // assert
      expect(actualState).toEqual(expectedState)
    })

    it('should skip if no recipes exist', () => {
      // arrange
      const state: RecipesState = { ids: [], entities: {} }
      const action = actions.clearAllRecipes()

      // act
      const actualState = recipesReducer(state, action)

      // assert
      expect(actualState).toBe(state)
    })
  })
})
