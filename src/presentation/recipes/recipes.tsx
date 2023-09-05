/* eslint-disable @typescript-eslint/no-use-before-define */

import { Component, createSignal } from 'solid-js'
import { useAuthContext } from '../../business/auth/context/auth-context'
import { FireRecipesColumn } from './fire/fire-recipes'
import { Action, RandomRecipesColumn } from './random/random-recipes'
import './styles.scss'

export const RecipesPage: Component = () => {
  const { authState } = useAuthContext()

  const [addFireRecipe1, setAddFireRecipe1] = createSignal<Pick<Action, 'enabled' | 'action'>>({})
  const [addFireRecipe2, setAddFireRecipe2] = createSignal<Pick<Action, 'enabled' | 'action'>>({})
  const [error, setError] = createSignal<string | null>()

  return (
    <div>
      <h1>Recipes of {authState.authUser?.name}</h1>
      <div class="error">{error() ?? ''}</div>
      <div class="columns">
        <RandomRecipesColumn
          actions={[
            {
              text: '+',
              enabled: addFireRecipe1().enabled,
              action: addFireRecipe1().action,
            },
            {
              text: '*',
              enabled: addFireRecipe2().enabled,
              action: addFireRecipe2().action,
            },
          ]}
        />
        <FireRecipesColumn setError={setError} setAddRecipe={setAddFireRecipe1} />
        <FireRecipesColumn setError={setError} setAddRecipe={setAddFireRecipe2} />
      </div>
    </div>
  )
}
