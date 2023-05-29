import { AppThunk } from '../../app.store'
import { RecipeBook } from '../model'
import { actions } from './recipe-books.slice'

export function refreshBucketDocuments(): AppThunk<Promise<void>> {
  return async () => {
    // not implemented yet
  }
}

export function setBucketDocument(recipeBook: RecipeBook): AppThunk<Promise<void>> {
  return async (dispatch) => {
    dispatch(actions.setBucketDocument({ document: recipeBook }))
  }
}

export function deleteBucketDocument(id: string): AppThunk<Promise<void>> {
  return async (dispatch) => {
    dispatch(actions.deleteBucketDocument({ id }))
  }
}
