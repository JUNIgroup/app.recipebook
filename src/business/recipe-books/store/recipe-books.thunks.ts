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
import { bucketActions, recipeActions } from './recipe-books.slice'

const prepareRecipeBook = (p: { recipeBook: RecipeBook }) => ({ document: p.recipeBook })
const prepareRecipeBookId = (p: { recipeBookId: ID }) => ({ bucketId: p.recipeBookId })
const prepareRecipe = (p: { recipeBookId: ID; recipe: Recipe }) => ({ bucketId: p.recipeBookId, document: p.recipe })
const prepareRecipeId = (p: { recipeBookId: ID; recipeId: ID }) => ({ bucketId: p.recipeBookId, id: p.recipeId })

/**
 * Refresh all recipe books but not the recipes.
 */
export const refreshRecipeBooks = createRefreshBucketDocuments(bucketActions)

/**
 * Add a new recipe book to the database.
 *
 * @param recipeBook the recipe book to add
 */
export const addRecipeBook = createAddBucket(bucketActions, prepareRecipeBook)

/**
 * Update an existing recipe book in the database.
 *
 * @param recipeBook the recipe book to update
 */
export const updateRecipeBook = createUpdateBucketDocument(bucketActions, prepareRecipeBook)

/**
 * Delete an existing recipe book from the database.
 *
 * @param recipeBookId the id of the recipe book to delete
 */
export const deleteRecipeBook = createDeleteBucket(bucketActions, prepareRecipeBookId)

/**
 * Refresh all recipes of the specified recipe book.
 *
 * @param recipeBookId the ID of the recipe book, which recipes should be refreshed
 */
export const refreshRecipes = createRefreshCollectionDocuments(recipeActions, prepareRecipeBookId)

/**
 * Add a new recipe in the specified recipe book to the database.
 *
 * @param recipeBookId the ID of the recipe book
 * @param recipe the recipe to add
 */
export const addRecipe = createAddCollectionDocument(recipeActions, prepareRecipe)

/**
 * Update an existing recipe in the specified recipe book in the database.
 *
 * @param recipeBookId the ID of the recipe book
 * @param recipe the recipe to update
 */
export const updateRecipe = createUpdateCollectionDocument(recipeActions, prepareRecipe)

/**
 * Delete an existing recipe from the specified recipe book in the database.
 *
 * @param recipeBookId the ID of the recipe book
 * @param id the ID of the recipe to delete
 */
export const deleteRecipe = createDeleteCollectionDocument(recipeActions, prepareRecipeId)
