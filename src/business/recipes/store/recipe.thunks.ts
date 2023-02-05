import { AppThunk, Services } from '../../app.store'
import { Recipe } from '../model/recipe.model'
import { actions } from './recipe.slice'

function toPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function addRecipe(recipe: Recipe): AppThunk<Promise<void>> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    await dbService.startUpdateTransaction(['recipes'], async (tx) => {
      const object = {
        changeIndex: 0,
        data: recipe,
      }
      const recipesStore = tx.objectStore('recipes')
      await toPromise(recipesStore.add(object))
    })
    dispatch(actions.addRecipe({ recipe }))
  }
}

export function updateRecipe(recipe: Recipe): AppThunk<Promise<void>> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    await dbService.startUpdateTransaction(['recipes'], async (tx) => {
      const recipesStore = tx.objectStore('recipes')
      console.warn('recipe ID', recipe)
      const object = await toPromise(recipesStore.get(recipe.id))
      object.changeIndex += 1
      object.data = recipe
      await toPromise(recipesStore.put(object))
    })
    dispatch(actions.updateRecipe({ recipe }))
  }
}

export function removeRecipe(id: string): AppThunk<Promise<void>> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    await dbService.startUpdateTransaction(['recipes'], async (tx) => {
      const recipesStore = tx.objectStore('recipes')
      await toPromise(recipesStore.delete(id))
    })
    dispatch(actions.removeRecipe({ id }))
  }
}

export function fetchRecipes(): AppThunk<Promise<void>> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    const recipes = await dbService.startReadTransaction(['recipes'], async (tx) => {
      const recipesStore = tx.objectStore('recipes')
      const all = await toPromise(recipesStore.getAll())
      return all.map((object) => object.data as Recipe)
    })
    dispatch(actions.setAllRecipes({ recipes }))
  }
}
