import { selectAllBucketDocumentsSortedByString } from './recipe-books.selectors'

export {
  selectAllBucketDocuments as selectAllRecipeBooks,
  selectBucketById as selectRecipeBookById,
} from './recipe-books.selectors'

export const selectAllRecipeBooksSortedByTitle = selectAllBucketDocumentsSortedByString((doc) => doc.title)
