import { Recipe } from '../../business/recipes/model/recipe.model'
import { UNLOADED, dataFilter } from '../../business/helper/redux/redux-helper'

const API_KEY = '1' // for development purpose
const API_ENDPOINT = `https://www.themealdb.com/api/json/v1/${API_KEY}/random.php`

export type RecipeBody = Omit<Recipe, 'id' | 'creator'>

async function fetchRandomRecipe() {
  try {
    const response = await fetch(API_ENDPOINT)
    const data = await response.json()
    const meal = data.meals[0] as Record<string, string>
    const recipe: RecipeBody = {
      version: 1,
      title: meal.strMeal,
      subtitle: meal.strArea || undefined,
      origin: {
        uri: meal.strSource,
        description: `from TheMealDB recipe ${meal.idMeal}`,
      },
    }
    return recipe
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    return UNLOADED
  }
}

export async function getRandomRecipes(): Promise<RecipeBody[]> {
  const recipes = await Promise.all([fetchRandomRecipe(), fetchRandomRecipe(), fetchRandomRecipe()])
  return recipes.filter(dataFilter)
}
