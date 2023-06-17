import { ID } from '../database/database-types'
import { Recipe, RecipeBook } from '../model'
import {
  createAddBucket,
  createAddCollectionDocument,
  createDeleteBucket,
  createDeleteCollectionDocument,
  createRefreshBucketDocuments,
  createRefreshCollectionDocuments,
  createUpdateBucketDocument,
  createUpdateCollectionDocument,
} from './builder/thunks'
import { actions } from './recipe-books.slice'

const prepareRecipeBook = (p: { recipeBook: RecipeBook }) => ({ document: p.recipeBook })
const prepareRecipeBookId = (p: { recipeBookId: ID }) => ({ bucketId: p.recipeBookId })
const prepareRecipe = (p: { recipeBookId: ID; recipe: Recipe }) => ({
  bucketId: p.recipeBookId,
  collectionName: 'recipes' as const,
  document: p.recipe,
})
const prepareRecipeId = (p: { recipeBookId: ID; recipeId: ID }) => ({
  bucketId: p.recipeBookId,
  collectionName: 'recipes' as const,
  id: p.recipeId,
})

/**
 * Refresh all recipe books but not the recipes.
 */
export const refreshRecipeBooks = createRefreshBucketDocuments(actions)

/**
 * Add a new recipe book to the database.
 *
 * @param recipeBook the recipe book to add
 */
export const addRecipeBook = createAddBucket(actions, prepareRecipeBook)

/**
 * Update an existing recipe book in the database.
 *
 * @param recipeBook the recipe book to update
 */
export const updateRecipeBook = createUpdateBucketDocument(actions, prepareRecipeBook)

/**
 * Delete an existing recipe book from the database.
 *
 * @param recipeBookId the id of the recipe book to delete
 */
export const deleteRecipeBook = createDeleteBucket(actions, prepareRecipeBookId)

/**
 * Refresh all recipes of the specified recipe book.
 *
 * @param recipeBookId the ID of the recipe book, which recipes should be refreshed
 */
export const refreshRecipes = createRefreshCollectionDocuments(actions, prepareRecipeBookId)

/**
 * Add a new recipe in the specified recipe book to the database.
 *
 * @param recipeBookId the ID of the recipe book
 * @param recipe the recipe to add
 */
export const addRecipe = createAddCollectionDocument(actions, prepareRecipe)

/**
 * Update an existing recipe in the specified recipe book in the database.
 *
 * @param recipeBookId the ID of the recipe book
 * @param recipe the recipe to update
 */
export const updateRecipe = createUpdateCollectionDocument(actions, prepareRecipe)

/**
 * Delete an existing recipe from the specified recipe book in the database.
 *
 * @param recipeBookId the ID of the recipe book
 * @param id the ID of the recipe to delete
 */
export const deleteRecipe = createDeleteCollectionDocument(actions, prepareRecipeId)
