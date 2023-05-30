/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { useEffect, useState } from 'react'
import { ulid } from 'ulid'
import * as fromAuth from '../../../business/auth'
import { Recipe } from '../../../business/recipe-books/model'
import * as fromRecipeBooks from '../../../business/recipe-books/store'
import { useAppDispatch, useAppSelector } from '../../store.hooks'
import { RecipeBody } from '../random/random'
import { BookSelector } from './book-selector'
import { RecipeItem } from './recipe-item'

export type FireRecipesProps = {
  setError: (error: string | null) => void
  setAddRecipe: (action: null | ((recipe: RecipeBody) => Promise<void>)) => void
}

export const FireRecipesColumn: React.FC<FireRecipesProps> = ({ setError, setAddRecipe }) => {
  const [selectedBookId, selectBookId] = useState<string | null>(null)

  const user = useAppSelector(fromAuth.selectAuthorizedUser)
  if (!user) return null

  const dispatch = useAppDispatch()
  const allRecipes = useAppSelector((state) =>
    fromRecipeBooks.selectAllRecipesFromRecipeBook(state, selectedBookId ?? ''),
  )

  const refreshRecipes = async () => {
    setError(null)
    if (selectedBookId == null) return
    try {
      await dispatch(fromRecipeBooks.refreshRecipes(selectedBookId))
      // eslint-disable-next-line no-console
      console.log('Recipes fetched')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  useEffect(() => {
    if (selectedBookId == null) {
      setAddRecipe(null)
      return undefined
    }

    setAddRecipe(async (recipeBody: RecipeBody) => {
      const recipe: Recipe = {
        ...recipeBody,
        id: ulid(),
        rev: 0,
      }
      try {
        await dispatch(fromRecipeBooks.addRecipe(selectedBookId, recipe))

        // eslint-disable-next-line no-console
        console.log('Document added with ID: ', recipe.id)
      } catch (err) {
        setError((err as Error).message)
      }
    })

    return () => {
      setAddRecipe(null)
    }
  }, [dispatch, setAddRecipe, user.id, selectedBookId])

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
          <RecipeItem key={recipe.id} setError={setError} bookId={selectedBookId ?? ''} recipe={recipe} />
        ))}
      </ul>{' '}
    </div>
  )
}
