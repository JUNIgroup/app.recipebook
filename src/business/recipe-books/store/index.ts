import {
  selectAllBucketDocumentsSortedByString,
  selectCollectionDocuments,
  selectCollectionDocumentsSortedByString,
} from './recipe-books.selectors'

export {
  selectAllBucketDocuments as selectAllRecipeBooks,
  selectBucketById as selectRecipeBookById,
} from './recipe-books.selectors'

export const selectAllRecipeBooksSortedByTitle = selectAllBucketDocumentsSortedByString((doc) => doc.title)

export const selectAllRecipesFromRecipeBook = selectCollectionDocuments('recipes')

export const selectAllRecipesSortedByTitleFromRecipeBook = selectCollectionDocumentsSortedByString(
  'recipes',
  (doc) => doc.title,
)

export const selectRecipeById = selectCollectionDocuments('recipes')

export {
  refreshBucketDocuments as refreshRecipeBooks,
  setBucketDocument as setRecipeBook,
  deleteBucketDocument as deleteRecipeBook,
} from './recipe-books.thunks'
