import { ID } from '../database/database-types'
import { Recipe, RecipeBook } from '../model'
import { checkNotDeleted, checkRevisionZero, increaseRevision, markDeleted } from './builder/prepare'
import {
  createPushBucketDocument,
  createPushCollectionDocument,
  createRefreshBucketDocuments,
  createRefreshCollectionDocuments,
} from './builder/thunks'
import { actions, sliceName } from './recipe-books.slice'

const prepareRecipeBook = (p: { recipeBook: RecipeBook }) => ({
  document: p.recipeBook,
})

const prepareRecipeCollection = (p: { recipeBookId: ID }) => ({
  bucketId: p.recipeBookId,
  collectionName: 'recipes' as const,
})

const prepareRecipe = (p: { recipeBookId: ID; recipe: Recipe }) => ({
  bucketId: p.recipeBookId,
  collectionName: 'recipes' as const,
  document: p.recipe,
})

const context = {
  sliceName,
  actions,
}

/**
 * Refresh all recipe books but not the recipes.
 */
export const refreshRecipeBooks = createRefreshBucketDocuments(context)

/**
 * Add a new recipe book to the database.
 *
 * @param recipeBook the recipe book to add
 */
export const addRecipeBook = createPushBucketDocument(
  'add',
  context,
  checkRevisionZero(checkNotDeleted(prepareRecipeBook)),
)

/**
 * Update an existing recipe book in the database.
 *
 * @param recipeBook the recipe book to update
 */
export const updateRecipeBook = createPushBucketDocument(
  'update',
  context,
  increaseRevision(checkNotDeleted(prepareRecipeBook)),
)

/**
 * Delete an existing recipe book from the database.
 *
 * @param recipeBookId the id of the recipe book to delete
 */
export const deleteRecipeBook = createPushBucketDocument(
  'delete',
  context,
  increaseRevision(markDeleted(prepareRecipeBook)),
)

/**
 * Refresh all recipes of the specified recipe book.
 *
 * @param recipeBookId the ID of the recipe book, which recipes should be refreshed
 */
export const refreshRecipes = createRefreshCollectionDocuments(context, prepareRecipeCollection)

/**
 * Add a new recipe in the specified recipe book to the database.
 *
 * @param recipeBookId the ID of the recipe book
 * @param recipe the recipe to add
 */
export const addRecipe = createPushCollectionDocument(
  'add', //
  context,
  checkRevisionZero(checkNotDeleted(prepareRecipe)),
)

/**
 * Update an existing recipe in the specified recipe book in the database.
 *
 * @param recipeBookId the ID of the recipe book
 * @param recipe the recipe to update
 */
export const updateRecipe = createPushCollectionDocument(
  'update',
  context,
  increaseRevision(checkNotDeleted(prepareRecipe)),
)

/**
 * Delete an existing recipe from the specified recipe book in the database.
 *
 * @param recipeBookId the ID of the recipe book
 * @param recipe the recipe to delete
 */
export const deleteRecipe = createPushCollectionDocument(
  'delete',
  context,
  increaseRevision(markDeleted(prepareRecipe)),
)
