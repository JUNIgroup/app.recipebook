import { useEffect, useState } from 'react'
import { ulid } from 'ulid'
import * as fromAuth from '../../business/auth'
import { Recipe } from '../../business/recipes/model/recipe.model'
import { useAppDispatch, useAppSelector } from '../store.hooks'
import { getRandomRecipes, RecipeBody } from './random'
import { selectAllRecipesSortedByName } from '../../business/recipes/store/recipe.selectors'
import { actions as recipesActions } from '../../business/recipes/store/recipe.slice'

import './styles.scss'

export const RecipesPage = () => {
  const user = useAppSelector(fromAuth.selectAuthorizedUser)
  if (!user) return null

  const [randomRecipes, setRandomRecipes] = useState<null | RecipeBody[]>(null)

  const dispatch = useAppDispatch()
  const allRecipes = useAppSelector(selectAllRecipesSortedByName)

  useEffect(() => {
    if (randomRecipes === null) {
      getRandomRecipes().then((recipes) => setRandomRecipes(recipes))
    }
  }, [randomRecipes === null])

  const newRandomRecipes = () => setRandomRecipes(null)
  const addRandomRecipe = async (recipeBody: RecipeBody) => {
    const recipe: Recipe = {
      ...recipeBody,
      id: ulid(),
      creator: user.id,
    }
    dispatch(recipesActions.addRecipe({ recipe }))
    // eslint-disable-next-line no-console
    console.log('Document added with ID: ', recipe.id)
  }
  const refreshRecipes = () => {
    // not supported because we use sync store
  }
  const removeRecipe = async (id: string) => {
    dispatch(recipesActions.removeRecipe({ id }))
    // eslint-disable-next-line no-console
    console.log('Document deleted with ID: ', id)
  }

  return (
    <div>
      <h1>Recipes of {user.name}</h1>
      <div className="columns">
        <div className="column">
          <h2>
            Add a new recipe{' '}
            <button data-testid="random" type="button" className="icon" onClick={newRandomRecipes}>
              ↺
            </button>
          </h2>
          {randomRecipes === null ? (
            <div>...</div>
          ) : (
            <ul>
              {randomRecipes.map((recipe, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <li key={`rnd${idx}`}>
                  {!recipe.origin ? (
                    <span>{recipe.title}</span>
                  ) : (
                    <a
                      href={recipe.origin.uri}
                      title={recipe.origin.description ?? recipe.title}
                      target="recipe-origin"
                    >
                      {recipe.title}
                    </a>
                  )}
                  <button type="button" className="icon" onClick={() => addRandomRecipe(recipe)}>
                    +
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="column">
          <h2>
            Your recipes
            <button type="button" className="icon" onClick={refreshRecipes}>
              ↺
            </button>
          </h2>
          <ul>
            {allRecipes.map((recipe) => (
              <li key={recipe.id}>
                {recipe.origin ? (
                  <a href={recipe.origin.uri} title={recipe.origin.description ?? recipe.title} target="recipe-origin">
                    {recipe.title}
                  </a>
                ) : (
                  <span>{recipe.title}</span>
                )}
                <button type="button" className="icon" onClick={() => removeRecipe(recipe.id)}>
                  -
                </button>
              </li>
            ))}
          </ul>{' '}
        </div>
      </div>
    </div>
  )
}
