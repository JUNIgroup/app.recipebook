import { AppThunk } from '../../app.store'
import { Recipe, RecipeBook } from '../model'
import { actions } from './recipe-books.slice'

type Collection = 'recipes'

export function refreshBucketDocuments(): AppThunk<Promise<void>> {
  return async () => {
    // not implemented yet
  }
}

export function createBucket(recipeBook: RecipeBook): AppThunk<Promise<void>> {
  return async (dispatch) => {
    dispatch(actions.addRecipeBook({ document: recipeBook }))
  }
}

export function updateBucketDocument(recipeBook: RecipeBook): AppThunk<Promise<void>> {
  return async (dispatch) => {
    dispatch(actions.updateRecipeBook({ document: recipeBook }))
  }
}

export function deleteBucket(bucketId: string): AppThunk<Promise<void>> {
  return async (dispatch) => {
    dispatch(actions.deleteRecipeBook({ bucketId }))
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function refreshCollectionDocuments(bucketId: string, collection: Collection): AppThunk<Promise<void>> {
  return async () => {
    // not implemented yet
  }
}

export function addCollectionDocument(
  bucketId: string,
  collection: Collection,
  document: Recipe,
): AppThunk<Promise<void>> {
  return async (dispatch) => {
    dispatch(actions.addRecipe({ bucketId, document }))
  }
}

export function updateCollectionDocument(
  bucketId: string,
  collection: Collection,
  document: Recipe,
): AppThunk<Promise<void>> {
  return async (dispatch) => {
    dispatch(actions.updateRecipe({ bucketId, document }))
  }
}

export function deleteCollectionDocument(
  bucketId: string,
  collection: Collection,
  id: string,
): AppThunk<Promise<void>> {
  return async (dispatch) => {
    dispatch(actions.deleteRecipe({ bucketId, id }))
  }
}
