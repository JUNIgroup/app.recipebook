/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { useState } from 'react'
import * as fromAuth from '../../../business/auth'
import * as fromRecipeBooks from '../../../business/recipe-books/store'
import * as fromRecipes from '../../../business/recipes'
import { useAppDispatch, useAppSelector } from '../../store.hooks'

import { BookSelector } from './book-selector'
import { RecipeItem } from './recipe-item'

export type FireRecipesProps = {
  setError: (error: string | null) => void
}

export const FireRecipesColumn: React.FC<FireRecipesProps> = ({ setError }) => {
  const [selectedBookId, selectBookId] = useState<string | null>(null)

  const user = useAppSelector(fromAuth.selectAuthorizedUser)
  if (!user) return null

  const dispatch = useAppDispatch()
  const allRecipes = useAppSelector((state) => fromRecipeBooks.selectAllRecipesFromRecipeBook(state, selectedBookId))

  const refreshRecipes = () => {
    setError(null)
    dispatch(fromRecipes.fetchRecipes()).catch((err) => setError(err.message))
    // eslint-disable-next-line no-console
    console.log('Recipes fetched')
  }

  return (
    <div className="column">
      <h2 className="title">
        <BookSelector setError={setError} selectedBookId={selectedBookId} onSelectBookId={selectBookId} />
        <button className="title-action icon" type="button" onClick={refreshRecipes}>
          ↺
        </button>
      </h2>
      <ul className="cards">
        {allRecipes.map((recipe) => (
          <RecipeItem key={recipe.id} recipe={recipe} />
        ))}
      </ul>{' '}
    </div>
  )
}
