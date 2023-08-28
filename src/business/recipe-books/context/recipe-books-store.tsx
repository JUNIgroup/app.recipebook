import { batch } from 'solid-js'
import { SetStoreFunction, createStore } from 'solid-js/store'
import { Logger } from '../../../utilities/logger'
import { byString } from '../../data-context.builder/orders'
import { ID } from '../../database/database-types'
import { Recipe, RecipeBook } from '../model'
import { fullRecipe, fullRecipeBook } from '../model/recipe-books.samples'

export type RecipeBookStructure = {
  bucket: RecipeBook
  collections: {
    recipes: Recipe
  }
}

export type RecipeBooksState = {
  ids: ID[]
  lastUpdate?: number | undefined
  entities: {
    [id: string]: {
      book: RecipeBook
      recipes: {
        ids: ID[]
        lastUpdate?: number | undefined
        entities: {
          [id: string]: Recipe
        }
      }
    }
  }
}

type Update<T> = (set: SetStoreFunction<T>, get: T) => void

export interface RecipeBooksStore {
  recipeBooksState: RecipeBooksState

  selectRecipeBooksSortedByTitle(): RecipeBook[]
  selectRecipeBookById(recipeBookId: ID | null): RecipeBook | null

  selectRecipesSortedByTitle(recipeBookId: ID | null): Recipe[]
  selectRecipeById(recipeBookId: ID | null, recipeId: ID | null): Recipe | null

  refreshRecipeBooks(): Promise<void>
  addRecipeBook(recipeBook: RecipeBook): Promise<void>
  deleteRecipeBook(recipeBookId: ID | null): Promise<boolean>

  refreshRecipes(recipeBookId: ID): Promise<void>
  addRecipe(recipeBookId: ID, recipe: Recipe): Promise<void>
  deleteRecipe(recipeBookId: ID, recipeId: ID | null): Promise<boolean>
  updateRecipe(recipeBookId: ID, recipeId: ID, update: Update<Recipe>): Promise<void>
}

export function createRecipeBooksStore(logger: Logger<'business'>): RecipeBooksStore {
  const log = logger('business:RecipeBooksStore')
  const [recipeBooksState, updateState] = createStore<RecipeBooksState>({
    ids: [fullRecipeBook.id],
    lastUpdate: undefined,
    entities: {
      [fullRecipeBook.id]: {
        book: fullRecipeBook,
        recipes: {
          ids: [fullRecipe.id],
          lastUpdate: undefined,
          entities: {
            [fullRecipe.id]: fullRecipe,
          },
        },
      },
    },
  })

  const byTitle = byString<{ title: string }>((entity) => entity.title)

  const selectRecipeBooksSortedByTitle: RecipeBooksStore['selectRecipeBooksSortedByTitle'] = () => {
    const entities = recipeBooksState.ids.map((id) => recipeBooksState.entities[id].book)
    return entities.sort(byTitle)
  }

  const selectRecipeBookById: RecipeBooksStore['selectRecipeBookById'] = (recipeBookId) =>
    recipeBooksState.entities[recipeBookId ?? '']?.book ?? null

  const selectRecipesSortedByTitle: RecipeBooksStore['selectRecipesSortedByTitle'] = (recipeBookId) => {
    const collection = recipeBooksState.entities[recipeBookId ?? '']?.recipes
    if (!collection) return []
    const entities = collection.ids.map((id) => collection.entities[id])
    return entities.sort(byString<{ title: string }>((entity) => entity.title))
  }

  const selectRecipeById: RecipeBooksStore['selectRecipeById'] = (recipeBookId, recipeId) => {
    const collection = recipeBooksState.entities[recipeBookId ?? '']?.recipes
    if (!collection) return null
    return collection.entities[recipeId ?? ''] ?? null
  }

  const refreshRecipeBooks: RecipeBooksStore['refreshRecipeBooks'] = async () => {
    // nothing to do yet
  }

  const addRecipeBook: RecipeBooksStore['addRecipeBook'] = async (recipeBook) => {
    if (recipeBooksState.entities[recipeBook.id]) throw new Error(`RecipeBook with id ${recipeBook.id} already exists`)
    log.info('addRecipeBook', recipeBook.id, recipeBook.title)
    batch(() => {
      updateState('ids', recipeBooksState.ids.length, recipeBook.id)
      updateState('entities', recipeBook.id, {
        book: recipeBook,
        recipes: {
          ids: [],
          lastUpdate: undefined,
          entities: {},
        },
      })
    })
  }

  const deleteRecipeBook: RecipeBooksStore['deleteRecipeBook'] = async (recipeBookId) => {
    if (!recipeBookId || !recipeBooksState.entities[recipeBookId]) return false
    log.info('deleteRecipeBook', recipeBookId)
    batch(() => {
      updateState('ids', (ids) => ids.filter((id) => id !== recipeBookId))
      updateState('entities', { [recipeBookId]: undefined })
    })
    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const refreshRecipes: RecipeBooksStore['refreshRecipes'] = async (recipeBookId) => {
    // nothing to do yet
  }

  const addRecipe: RecipeBooksStore['addRecipe'] = async (recipeBookId, recipe) => {
    const collection = recipeBooksState.entities[recipeBookId]?.recipes
    if (!collection) throw new Error(`RecipeBook with id ${recipeBookId} does not exist`)
    if (collection.entities[recipe.id]) throw new Error(`Recipe with id ${recipe.id} already exists`)
    log.info('addRecipe', recipeBookId, recipe.id, recipe.title)
    batch(() => {
      updateState('entities', recipeBookId, 'recipes', 'ids', collection.ids.length, recipe.id)
      updateState('entities', recipeBookId, 'recipes', 'entities', recipe.id, recipe)
    })
  }
  const deleteRecipe: RecipeBooksStore['deleteRecipe'] = async (recipeBookId, recipeId) => {
    const collection = recipeBooksState.entities[recipeBookId]?.recipes
    if (!collection) throw new Error(`RecipeBook with id ${recipeBookId} does not exist`)
    if (!recipeId || !collection.entities[recipeId]) return false
    log.info('deleteRecipe', recipeBookId, recipeId)
    batch(() => {
      updateState('entities', recipeBookId, 'recipes', 'ids', (ids) => ids.filter((id) => id !== recipeId))
      updateState('entities', recipeBookId, 'recipes', 'entities', { [recipeId]: undefined })
    })
    return true
  }

  const updateRecipe: RecipeBooksStore['updateRecipe'] = async (recipeBookId, recipeId, update) => {
    const collection = recipeBooksState.entities[recipeBookId]?.recipes
    if (!collection) throw new Error(`RecipeBook with id ${recipeBookId} does not exist`)
    const entity = collection.entities[recipeId]
    if (!entity) throw new Error(`Recipe with id ${recipeId} does not exist`)
    log.info('updateRecipe', recipeBookId, recipeId)
    const [get, set] = createStore(entity)
    batch(() => {
      update(set, get)
    })
  }

  return {
    recipeBooksState,

    selectRecipeBooksSortedByTitle,
    selectRecipeBookById,

    selectRecipesSortedByTitle,
    selectRecipeById,

    refreshRecipeBooks,
    addRecipeBook,
    deleteRecipeBook,

    refreshRecipes,
    addRecipe,
    deleteRecipe,
    updateRecipe,
  }
}
