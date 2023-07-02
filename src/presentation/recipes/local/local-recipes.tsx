/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { useEffect } from 'react'
import { ulid } from 'ulid'
import * as fromAuth from '../../../business/auth'
import * as fromRecipes from '../../../business/recipes'
import { Recipe } from '../../../business/recipes/model/recipe.model'
import { selectAllRecipesSortedByName } from '../../../business/recipes/store/recipe.selectors'
import { useAppDispatch, useAppSelector } from '../../store.hooks'
import { RecipeBody } from '../random/random'
import { RecipeItem } from './recipe-item'

export type LocalRecipesProps = {
  setError: (error: string | null) => void
  setAddRecipe: (action: null | ((recipe: RecipeBody) => Promise<void>)) => void
}

export const LocalRecipesColumn: React.FC<LocalRecipesProps> = ({ setError, setAddRecipe }) => {
  const user = useAppSelector(fromAuth.selectAuthorizedUser)
  if (!user) return null

  const dispatch = useAppDispatch()
  const allRecipes = useAppSelector(selectAllRecipesSortedByName)

  const refreshRecipes = () => {
    setError(null)
    dispatch(fromRecipes.fetchRecipes()).catch((err) => setError(err.message))
    // eslint-disable-next-line no-console
    console.log('Recipes fetched')
  }

  useEffect(() => {
    if (user == null) {
      setAddRecipe(null)
      return undefined
    }

    setAddRecipe(async (recipeBody: RecipeBody) => {
      const recipe: Recipe = {
        ...recipeBody,
        id: ulid(),
        creator: user?.id ?? '',
      }
      await dispatch(fromRecipes.addRecipe(recipe))

      // eslint-disable-next-line no-console
      console.log('Document added with ID: ', recipe.id)
    })

    return () => {
      setAddRecipe(null)
    }
  }, [dispatch, setAddRecipe, user.id])

  return (
    <div className="column">
      <h2 className="title">
        <div className="title-text stretch">Your recipes</div>
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
