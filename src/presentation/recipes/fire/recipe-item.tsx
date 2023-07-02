/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { Recipe } from '../../../business/recipe-books/model'
import * as fromRecipeBooks from '../../../business/recipe-books/store'
import { useAppDispatch } from '../../store.hooks'

export type RecipeItemProps = {
  setError: (error: string | null) => void
  bookId: string
  recipe: Recipe
}

export const RecipeItem: React.FC<RecipeItemProps> = ({ setError, bookId, recipe }) => {
  const dispatch = useAppDispatch()

  // const state = useAppSelector((rootState) => selectDBObjectStateById(rootState, recipe.id))

  const removeRecipe = async () => {
    setError(null)
    try {
      await dispatch(fromRecipeBooks.deleteRecipe({ recipeBookId: bookId, recipe }))
      // eslint-disable-next-line no-console
      console.log('Recipe removed')
    } catch (err) {
      setError((err as Error).message)
    }
    // dispatch(fromRecipes.removeRecipe(recipe.id))
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
    dispatch(fromRecipeBooks.updateRecipe({ recipeBookId: bookId, recipe: update }))
    // eslint-disable-next-line no-console
    console.log('Document updated with ID: ', recipe.id)
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
        <span className="card-subtitle clickable" onClick={() => updateRecipe()}>
          {recipe.subtitle}
        </span>
      </div>
      <div className="card-actions">
        <button type="button" className="icon" onClick={() => removeRecipe()}>
          -
        </button>
      </div>
    </li>
  )
}
