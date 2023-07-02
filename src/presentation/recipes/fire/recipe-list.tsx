import { useEffect } from 'react'
import * as fromRecipeBooks from '../../../business/recipe-books/store'
import { useAppSelector } from '../../store.hooks'
import { RecipeItem } from './recipe-item'

export type RecipeListProps = {
  setError: (error: string | null) => void
  selectedBookId: string | null
}

export const RecipeList: React.FC<RecipeListProps> = ({ setError, selectedBookId }) => {
  const allRecipes = useAppSelector((state) => fromRecipeBooks.selectRecipes(state, selectedBookId ?? ''))

  useEffect(() => {
    console.log('RecipeList: selectedBookId', selectedBookId)
  }, [selectedBookId, allRecipes])

  return (
    <div className="column">
      <ul className="cards">
        {allRecipes.map((recipe) => (
          <RecipeItem key={recipe.id} setError={setError} bookId={selectedBookId ?? ''} recipe={recipe} />
        ))}
      </ul>{' '}
    </div>
  )
}
