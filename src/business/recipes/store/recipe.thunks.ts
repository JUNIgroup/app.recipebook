import { AppThunk } from '../../app.store'
import * as fromDB from '../../db'
import { Recipe } from '../model/recipe.model'
import { isRecipe } from '../model/recipe.schema'
import { actions } from './recipe.slice'

export function addRecipe(recipe: Recipe): AppThunk<Promise<void>> {
  return async (dispatch) => {
    await dispatch(
      fromDB.updateInDB(['recipes'], async (tx) => {
        await tx.add('recipes', recipe)
      }),
    )
    dispatch(actions.addRecipe({ recipe }))
  }
}

export function updateRecipe(recipe: Recipe): AppThunk<Promise<void>> {
  return async (dispatch) => {
    await dispatch(
      fromDB.updateInDB(['recipes'], async (tx) => {
        await tx.update('recipes', recipe)
      }),
    )
    dispatch(actions.updateRecipe({ recipe }))
  }
}

export function removeRecipe(id: string): AppThunk<Promise<void>> {
  return async (dispatch) => {
    await dispatch(
      fromDB.updateInDB(['recipes'], async (tx) => {
        await tx.delete('recipes', id)
      }),
    )
    dispatch(actions.removeRecipe({ id }))
  }
}

const filterRecipe = (recipe: unknown): recipe is Recipe => isRecipe(recipe)

export function fetchRecipes(): AppThunk<Promise<void>> {
  return async (dispatch) => {
    const recipes = await dispatch(
      fromDB.readFromDB(['recipes'], async (tx) => {
        const all = await tx.getAll('recipes')
        return all.filter(filterRecipe)
      }),
    )
    dispatch(actions.setAllRecipes({ recipes }))
  }
}
