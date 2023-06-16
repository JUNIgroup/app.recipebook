import { byString } from './builder/orders'
import {
  createSelectAllBucketDocuments,
  createSelectAllBucketDocumentsSorted,
  createSelectBucketDocumentById,
  createSelectAllCollectionDocuments,
  createSelectAllCollectionDocumentsSorted,
  createSelectCollectionDocumentById,
} from './builder/selectors'
import { RecipeBooksState } from './recipe-books.slice'

type PartialRootState = { recipeBooks: RecipeBooksState }
const selectRoot = (state: PartialRootState) => state.recipeBooks

const byTitle = byString<{ title: string }>((book) => book.title)

export const selectRecipeBooks = createSelectAllBucketDocuments(selectRoot)
export const selectRecipeBooksSortedByTitle = createSelectAllBucketDocumentsSorted(selectRoot, byTitle)
export const selectRecipeBookById = createSelectBucketDocumentById(selectRoot)

export const selectRecipes = createSelectAllCollectionDocuments(selectRoot, 'recipes')
export const selectRecipesSortedByTitle = createSelectAllCollectionDocumentsSorted(selectRoot, 'recipes', byTitle)
export const selectRecipeById = createSelectCollectionDocumentById(selectRoot, 'recipes')
