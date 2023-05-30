import { Recipe } from '../model'
import {
  selectAllBucketDocuments,
  selectAllBucketDocumentsSortedByString,
  selectBucketDocumentById,
  selectCollectionDocuments,
  selectCollectionDocumentsSortedByString,
} from './recipe-books.selectors'
import {
  addCollectionDocument,
  createBucket,
  deleteBucket,
  deleteCollectionDocument,
  refreshBucketDocuments,
  refreshCollectionDocuments,
  updateBucketDocument,
  updateCollectionDocument,
} from './recipe-books.thunks'

export const selectAllRecipeBooks = selectAllBucketDocuments

export const selectAllRecipeBooksSortedByTitle = selectAllBucketDocumentsSortedByString((doc) => doc.title)

export const selectRecipeBookById = selectBucketDocumentById

export const selectAllRecipesFromRecipeBook = selectCollectionDocuments('recipes')

export const selectAllRecipesSortedByTitleFromRecipeBook = //
  selectCollectionDocumentsSortedByString('recipes', (doc) => doc.title)

export const selectRecipeById = selectCollectionDocuments('recipes')

export const refreshRecipeBooks = refreshBucketDocuments

export const addRecipeBook = createBucket

export const updateRecipeBook = updateBucketDocument

export const deleteRecipeBook = deleteBucket

export const refreshRecipes = (bucketId: string) => refreshCollectionDocuments(bucketId, 'recipes')

export const addRecipe = (bucketId: string, recipe: Recipe) => addCollectionDocument(bucketId, 'recipes', recipe)

export const updateRecipe = (bucketId: string, recipe: Recipe) => updateCollectionDocument(bucketId, 'recipes', recipe)

export const deleteRecipe = (bucketId: string, id: string) => deleteCollectionDocument(bucketId, 'recipes', id)
