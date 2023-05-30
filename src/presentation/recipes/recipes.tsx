/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { useState } from 'react'
import * as fromAuth from '../../business/auth'
import { useAppSelector } from '../store.hooks'
import { RecipeBody } from './random/random'

import { LocalRecipesColumn } from './local/local-recipes'
import { Action, RandomRecipesColumn } from './random/random-recipes'

import { FireRecipesColumn } from './fire/fire-recipes'
import './styles.scss'

export const RecipesPage = () => {
  const user = useAppSelector(fromAuth.selectAuthorizedUser)
  if (!user) return null

  const [error, setError] = useState<string | null>()

  const [addLocalRecipeAction, setAddLocalRecipeAction] = useState<Action>({
    key: 'add-local',
    text: '+¹',
    enabled: false,
    action: () => {},
  })

  const setAddLocalRecipe = (fn: null | ((recipe: RecipeBody) => Promise<void>)) => {
    setAddLocalRecipeAction((action) => ({
      ...action,
      enabled: fn != null,
      action: fn ?? (() => {}),
    }))
  }

  const [addFireRecipeAction, setAddFireRecipeAction] = useState<Action>({
    key: 'add-fire',
    text: '+²',
    enabled: false,
    action: () => {},
  })

  const setAddFireRecipe = (fn: null | ((recipe: RecipeBody) => Promise<void>)) => {
    setAddFireRecipeAction((action) => ({
      ...action,
      enabled: fn != null,
      action: fn ?? (() => {}),
    }))
  }

  return (
    <div>
      <h1>Recipes of {user.name}</h1>
      <div className="error">{error ?? ''}</div>
      <div className="columns">
        <RandomRecipesColumn actions={[addLocalRecipeAction, addFireRecipeAction]} />
        <LocalRecipesColumn setError={setError} setAddRecipe={setAddLocalRecipe} />
        <FireRecipesColumn setError={setError} setAddRecipe={setAddFireRecipe} />
      </div>
    </div>
  )
}
