/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { useEffect, useState } from 'react'
import * as fromAuth from '../../../business/auth'
import { useAppSelector } from '../../store.hooks'
import { RecipeBody, getRandomRecipes } from './random'

export type Action = {
  key: string
  text: React.ReactNode
  enabled?: boolean
  action: (recipe: RecipeBody) => void
}

export type RandomRecipesColumnProps = {
  actions?: Action[]
}

export const RandomRecipesColumn: React.FC<RandomRecipesColumnProps> = ({ actions = [] }) => {
  const user = useAppSelector(fromAuth.selectAuthorizedUser)
  if (!user) return null

  const [randomRecipes, setRandomRecipes] = useState<null | RecipeBody[]>(null)

  useEffect(() => {
    if (randomRecipes === null) {
      getRandomRecipes().then((recipes) => setRandomRecipes(recipes))
    }
  }, [randomRecipes === null])

  const newRandomRecipes = () => setRandomRecipes(null)
  return (
    <div className="column">
      <h2 className="title">
        <div className="title-text stretch">Add a new recipe</div>
        <button className="title-action icon" data-testid="random" type="button" onClick={newRandomRecipes}>
          ↺
        </button>
      </h2>
      {randomRecipes === null ? (
        <div>...</div>
      ) : (
        <ul className="cards">
          {randomRecipes.map((recipe, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={`rnd${idx}`} className="card">
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
                <span className="card-subtitle">{recipe.subtitle}</span>
              </div>
              <div className="card-actions">
                {actions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    className="icon"
                    disabled={!(action.enabled ?? true)}
                    onClick={() => action.action(recipe)}
                  >
                    {action.text}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
