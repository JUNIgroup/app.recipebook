/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { useState } from 'react'
import { ulid } from 'ulid'
import * as fromAuth from '../../business/auth'
import { selectDBObjectStateById } from '../../business/db/store/db.selectors'
import { DBObjectState } from '../../business/db/store/db.types'
import * as fromRecipes from '../../business/recipes'
import { Recipe } from '../../business/recipes/model/recipe.model'
import { selectAllRecipesSortedByName } from '../../business/recipes/store/recipe.selectors'
import { useAppDispatch, useAppSelector } from '../store.hooks'
import { RecipeBody } from './random/random'

import { RandomRecipesColumn } from './random/random-recipes'
import './styles.scss'

export const RecipesPage = () => {
  const user = useAppSelector(fromAuth.selectAuthorizedUser)
  if (!user) return null

  const [error, setError] = useState<string | null>()

  const dispatch = useAppDispatch()
  const allRecipes = useAppSelector(selectAllRecipesSortedByName)

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
  const refreshRecipes = () => {
    setError(null)
    dispatch(fromRecipes.fetchRecipes()).catch((err) => setError(err.message))
    // eslint-disable-next-line no-console
    console.log('Recipes fetched')
  }

  return (
    <div>
      <h1>Recipes of {user.name}</h1>
      <div className="error">{error ?? ''}</div>
      <div className="columns">
        <RandomRecipesColumn actions={[addRandomRecipeAction]} />
        <div className="column">
          <h2>
            Your recipes
            <button type="button" className="icon" onClick={refreshRecipes}>
              ↺
            </button>
          </h2>
          <ul>
            {allRecipes.map((recipe) => (
              <RecipeItem key={recipe.id} recipe={recipe} />
            ))}
          </ul>{' '}
        </div>
      </div>
    </div>
  )
}

const RecipeItem = ({ recipe }: { recipe: Recipe }) => {
  const dispatch = useAppDispatch()

  const state = useAppSelector((rootState) => selectDBObjectStateById(rootState, recipe.id))

  const removeRecipe = async () => {
    dispatch(fromRecipes.removeRecipe(recipe.id))
    // eslint-disable-next-line no-console
    console.log('Document deleted with ID: ', recipe.id)
  }

  const updateRecipe = () => {
    const inc = (string: string) => {
      const match = string.match(/(.*) 👍(\d+)$/)
      return match ? `${match[1]} 👍${parseInt(match[2], 10) + 1}` : `${string} 👍1`
    }
    const update = {
      ...recipe,
      subtitle: inc(recipe.subtitle ?? ''),
    }
    dispatch(fromRecipes.updateRecipe(update))
    // eslint-disable-next-line no-console
    console.log('Document updated with ID: ', recipe.id)
  }

  const refreshRecipe = () => {
    dispatch(fromRecipes.refreshRecipe(recipe.id))
    // eslint-disable-next-line no-console
    console.log('Document refreshed with ID: ', recipe.id)
  }

  return (
    <li key={recipe.id}>
      {recipe.origin ? (
        <a href={recipe.origin.uri} title={recipe.origin.description ?? recipe.title} target="recipe-origin">
          {recipe.title}
        </a>
      ) : (
        <span>{recipe.title}</span>
      )}
      <span className="subtitle" onClick={() => updateRecipe()}>
        {recipe.subtitle}
      </span>
      {state === DBObjectState.DELETED || state === DBObjectState.OUTDATED ? (
        <button type="button" className="icon" onClick={() => refreshRecipe()}>
          ↺
        </button>
      ) : (
        <button type="button" className="icon" onClick={() => removeRecipe()}>
          -
        </button>
      )}
    </li>
  )
}
