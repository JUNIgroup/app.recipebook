import { Component, For, createEffect, createMemo } from 'solid-js'
import { useRecipeBooksContext } from '../../../business/recipe-books/context/recipe-books-context'
import { logMount } from '../../utils/log-mount'
import { RecipeItem } from './recipe-item'

export type RecipeListProps = {
  setError: (error: string | null) => void
  selectedBookId: string | null
}

export const RecipeList: Component<RecipeListProps> = (props) => {
  logMount('RecipeList')

  const { selectRecipesSortedByTitle } = useRecipeBooksContext()
  const allRecipes = createMemo(() => selectRecipesSortedByTitle(props.selectedBookId))

  createEffect(() => {
    // eslint-disable-next-line no-console
    console.log('RecipeList: selectedBookId', props.selectedBookId, allRecipes().length)
  })

  return (
    <div class="column">
      <ul class="cards">
        <For each={allRecipes()}>
          {(recipe) => <RecipeItem setError={props.setError} bookId={props.selectedBookId ?? ''} recipe={recipe} />}
        </For>
      </ul>
    </div>
  )
}
