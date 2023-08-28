/* eslint-disable @typescript-eslint/no-use-before-define */

import { Component, Setter, createEffect, createSignal, onCleanup } from 'solid-js'
import { ulid } from 'ulid'
import { useRecipeBooksContext } from '../../../business/recipe-books/context/recipe-books-context'
import { Recipe } from '../../../business/recipe-books/model'
import { logMount } from '../../utils/log-mount'
import { RecipeBody } from '../random/random'
import { Action } from '../random/random-recipes'
import { BookSelector } from './book-selector'
import { RecipeList } from './recipe-list'

export type FireRecipesProps = {
  setError: (error: string | null) => void
  setAddRecipe: Setter<Pick<Action, 'enabled' | 'action'>>
}

export const FireRecipesColumn: Component<FireRecipesProps> = (props) => {
  logMount('FireRecipesColumn')

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { refreshRecipes, addRecipe } = useRecipeBooksContext()
  const [selectedBookId, selectBookId] = createSignal<string | null>(null)

  const refreshRecipesHandler = async () => {
    props.setError(null)
    const id = selectedBookId()
    if (id == null) return
    try {
      await refreshRecipes(id)
      // eslint-disable-next-line no-console
      console.log('Recipes fetched')
    } catch (err) {
      props.setError((err as Error).message)
    }
  }

  onCleanup(() => props.setAddRecipe({}))
  createEffect(() => {
    const bookId = selectedBookId()
    if (bookId == null) {
      props.setAddRecipe({})
      return
    }
    const action = async (recipeBody: RecipeBody) => {
      const recipe: Recipe = {
        ...recipeBody,
        id: ulid(),
        rev: 0,
      }
      try {
        await addRecipe(bookId, recipe)
        // eslint-disable-next-line no-console
        console.log('Document added with ID: ', recipe.id)
      } catch (err) {
        props.setError((err as Error).message)
      }
    }
    props.setAddRecipe({ enabled: true, action })
  })

  return (
    <div class="column">
      <h2 class="title">
        <BookSelector setError={props.setError} selectedBookId={selectedBookId()} onSelectBookId={selectBookId} />
        <button
          class="title-action icon"
          type="button"
          onClick={refreshRecipesHandler}
          disabled={selectedBookId() == null}
        >
          ↺
        </button>
      </h2>
      <RecipeList setError={props.setError} selectedBookId={selectedBookId()} />
    </div>
  )
}
