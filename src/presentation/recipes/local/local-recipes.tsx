/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import * as fromAuth from '../../../business/auth'
import * as fromRecipes from '../../../business/recipes'
import { selectAllRecipesSortedByName } from '../../../business/recipes/store/recipe.selectors'
import { useAppDispatch, useAppSelector } from '../../store.hooks'

import { RecipeItem } from './recipe-item'

export type LocalRecipesProps = {
  setError: (error: string | null) => void
}

export const LocalRecipesColumn: React.FC<LocalRecipesProps> = ({ setError }) => {
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
