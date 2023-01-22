import { ModelVersion, upgradeRecipe } from './recipe.model'
import { fullRecipeV1 } from './recipes.samples'

const fullRecipe = fullRecipeV1

describe('version', () => {
  it(`should be ${ModelVersion}`, () => {
    expect(fullRecipe.version).toBe(ModelVersion)
  })
})

describe('upgradeRecipe', () => {
  it('should not change the recipe', () => {
    expect(upgradeRecipe(fullRecipe)).toBe(fullRecipe)
  })
})
