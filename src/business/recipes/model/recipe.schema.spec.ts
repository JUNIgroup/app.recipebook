import {
  Change,
  ChangeDesc,
  DELETE,
  minimalOf,
  NON_OBJECT_SAMPLES,
  NON_STRING_SAMPLES,
} from '../../helper/validation/validation.test-helper'
import { isRecipe } from './recipe.schema'
import { fullRecipeV1 } from './recipes.samples'

const fullRecipe = fullRecipeV1

const allowedChanges: Change[] = [
  { path: 'id', values: ['newValue'] },
  { path: 'creator', values: ['newValue'] },
  { path: 'title', values: ['newValue'] },
  { path: 'subtitle', values: [undefined, DELETE, 'newValue'] },
  { path: 'origin', values: [undefined, DELETE, {}, { uri: 'new-uri' }] },
  { path: 'origin.uri', values: [undefined, DELETE, 'newValue'] },
  { path: 'origin.uri', values: [undefined, DELETE, 'newValue'] },
  { path: 'origin.description', values: [undefined, DELETE, 'newValue'] },
  { path: 'origin.description', values: [undefined, DELETE, 'newValue'] },
]

const forbiddenChanges: Change[] = [
  { path: 'id', values: [DELETE, undefined, '', ...NON_STRING_SAMPLES] },
  { path: 'creator', values: [DELETE, undefined, '', ...NON_STRING_SAMPLES] },
  { path: 'version', values: [DELETE, undefined, '', ...NON_STRING_SAMPLES] },
  { path: 'title', values: [DELETE, undefined, '', ...NON_STRING_SAMPLES] },
  { path: 'origin', values: [...NON_OBJECT_SAMPLES] },
  { path: 'origin.uri', values: [...NON_STRING_SAMPLES] },
  { path: 'origin.description', values: [...NON_STRING_SAMPLES] },
]

describe('isRecipe', () => {
  it('should accept full recipe', () => {
    expect(isRecipe(fullRecipe)).toBe(true)
  })

  describe('valid data', () => {
    it.each(ChangeDesc.fromChanges(allowedChanges))('should accept change %s', (change) => {
      const recipe = change.apply(fullRecipe)
      expect(isRecipe(recipe)).toBe(true)
    })

    const minimalRecipe = minimalOf(fullRecipe, allowedChanges)
    it(`should accept minimal recipe ${JSON.stringify(minimalRecipe)}`, () => {
      expect(isRecipe(minimalRecipe)).toBe(true)
    })
  })

  describe('invalid data', () => {
    it.each(ChangeDesc.fromChanges(forbiddenChanges))('should not accept change %s', (change) => {
      const recipe = change.apply(fullRecipe)
      expect(isRecipe(recipe)).toBe(false)
    })
  })
})
