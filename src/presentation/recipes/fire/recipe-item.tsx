/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { selectDBObjectStateById } from '../../../business/db/store/db.selectors'
import { DBObjectState } from '../../../business/db/store/db.types'
import * as fromRecipes from '../../../business/recipes'
import { Recipe } from '../../../business/recipes/model/recipe.model'
import { useAppDispatch, useAppSelector } from '../../store.hooks'

export const RecipeItem = ({ recipe }: { recipe: Recipe }) => {
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
    <li key={recipe.id} className="card">
      <div className="card-body">
        {recipe.origin ? (
          <a
            className="card-title"
            href={recipe.origin.uri}
            title={recipe.origin.description ?? recipe.title}
            target="recipe-origin"
          >
            {recipe.title}
          </a>
        ) : (
          <span className="card-title">{recipe.title}</span>
        )}
        <span className="card-subtitle" onClick={() => updateRecipe()}>
          {recipe.subtitle}
        </span>
      </div>
      <div className="card-actions">
        {state === DBObjectState.DELETED || state === DBObjectState.OUTDATED ? (
          <button type="button" className="icon" onClick={() => refreshRecipe()}>
            ↺
          </button>
        ) : (
          <button type="button" className="icon" onClick={() => removeRecipe()}>
            -
          </button>
        )}
      </div>
    </li>
  )
}
