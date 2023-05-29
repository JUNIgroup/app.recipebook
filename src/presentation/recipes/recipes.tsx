/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { useState } from 'react'
import { ulid } from 'ulid'
import * as fromAuth from '../../business/auth'
import * as fromRecipes from '../../business/recipes'
import { Recipe } from '../../business/recipes/model/recipe.model'
import { useAppDispatch, useAppSelector } from '../store.hooks'
import { RecipeBody } from './random/random'

import { LocalRecipesColumn } from './local/local-recipes'
import { RandomRecipesColumn } from './random/random-recipes'

import { FireRecipesColumn } from './fire/fire-recipes'
import './styles.scss'

export const RecipesPage = () => {
  const user = useAppSelector(fromAuth.selectAuthorizedUser)
  if (!user) return null

  const [error, setError] = useState<string | null>()

  const dispatch = useAppDispatch()

  const addRandomRecipe = async (recipeBody: RecipeBody) => {
    const recipe: Recipe = {
      ...recipeBody,
      id: ulid(),
      creator: user.id,
    }
    await dispatch(fromRecipes.addRecipe(recipe))
    // eslint-disable-next-line no-console
    console.log('Document added with ID: ', recipe.id)
  }

  const addRandomRecipeAction = {
    key: 'add',
    text: '+',
    action: addRandomRecipe,
  }

  return (
    <div>
      <h1>Recipes of {user.name}</h1>
      <div className="error">{error ?? ''}</div>
      <div className="columns">
        <RandomRecipesColumn actions={[addRandomRecipeAction]} />
        <LocalRecipesColumn setError={setError} />
        <FireRecipesColumn setError={setError} />
      </div>
    </div>
  )
}
