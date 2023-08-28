/* eslint-disable @typescript-eslint/no-use-before-define */

import { Component, createResource, For } from 'solid-js'
import { getRandomRecipes, RecipeBody } from './random'

export type Action = {
  text: string
  enabled?: boolean
  action?: (recipe: RecipeBody) => void
}

export type RandomRecipesColumnProps = {
  actions?: Action[]
}

export const RandomRecipesColumn: Component<RandomRecipesColumnProps> = (props) => {
  const [randomRecipes, { refetch }] = createResource<RecipeBody[]>(getRandomRecipes, {
    initialValue: [],
    name: 'random-recipes',
  })

  return (
    <div class="column">
      <h2 class="title">
        <div class="title-text stretch">Add a new recipe</div>
        <button class="title-action icon" data-testid="random" type="button" onClick={refetch}>
          ↺
        </button>
      </h2>
      {randomRecipes === null ? (
        <div>...</div>
      ) : (
        <ul class="cards">
          <For each={randomRecipes()}>
            {(recipe) => (
              <li class="card">
                <div class="card-body">
                  {recipe.origin ? (
                    <a
                      class="card-title"
                      href={recipe.origin.uri}
                      title={recipe.origin.description ?? recipe.title}
                      target="recipe-origin"
                    >
                      {recipe.title}
                    </a>
                  ) : (
                    <span class="card-title">{recipe.title}</span>
                  )}
                  <span class="card-subtitle">{recipe.subtitle}</span>
                </div>
                <div class="card-actions">
                  <For each={props.actions ?? []}>
                    {(action) => (
                      <button
                        type="button"
                        class="icon"
                        disabled={!action.enabled}
                        onClick={() => action.action?.(recipe)}
                      >
                        {action.text}
                      </button>
                    )}
                  </For>
                </div>
              </li>
            )}
          </For>
        </ul>
      )}
    </div>
  )
}
