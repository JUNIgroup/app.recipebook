/* eslint-disable @typescript-eslint/no-use-before-define */

import { Component, Show } from 'solid-js'
import { useRecipeBooksContext } from '../../../business/recipe-books/context/recipe-books-context'
import { Recipe } from '../../../business/recipe-books/model'
import { logMount } from '../../utils/log-mount'

export type RecipeItemProps = {
  setError: (error: string | null) => void
  bookId: string
  recipe: Recipe
}

export const RecipeItem: Component<RecipeItemProps> = (props) => {
  // eslint-disable-next-line solid/reactivity
  logMount(`RecipeItem ${props.recipe.id}`)

  const { deleteRecipe, updateRecipe } = useRecipeBooksContext()

  const removeRecipe = async () => {
    props.setError(null)
    const recipeId = props.recipe.id
    try {
      await deleteRecipe(props.bookId, recipeId)
      // eslint-disable-next-line no-console
      console.log('Recipe removed')
    } catch (err) {
      props.setError((err as Error).message)
    }
    // eslint-disable-next-line no-console
    console.log('Document deleted with ID: ', props.recipe.id)
  }

  const handleUpdateRecipe = async () => {
    const inc = (string = '') => {
      const match = string.match(/(.*) 👍(\d+)$/)
      return match ? `${match[1]} 👍${parseInt(match[2], 10) + 1}` : `${string} 👍1`
    }
    await updateRecipe(props.bookId, props.recipe.id, (set) => {
      set('subtitle', inc)
    })
    // eslint-disable-next-line no-console
    console.log('Document updated with ID: ', props.recipe.id)
  }

  return (
    <li class="card">
      <div class="card-body">
        <Show when={props.recipe.origin} fallback={<span class="card-title">{props.recipe.title}</span>}>
          {(origin) => (
            <a
              class="card-title"
              href={origin().uri}
              title={origin().description ?? props.recipe.title}
              target="recipe-origin"
            >
              {props.recipe.title}
            </a>
          )}
        </Show>
        <span class="card-subtitle clickable" onClick={() => handleUpdateRecipe()}>
          {props.recipe.subtitle}
        </span>
      </div>
      <div class="card-actions">
        <button type="button" class="icon" onClick={() => removeRecipe()}>
          -
        </button>
      </div>
    </li>
  )
}
