/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { FormEventHandler, MouseEventHandler, useRef, useState } from 'react'
import * as fromAuth from '../../../business/auth'
import * as fromRecipes from '../../../business/recipes'
import { selectAllRecipesSortedByName } from '../../../business/recipes/store/recipe.selectors'
import { useAppDispatch, useAppSelector } from '../../store.hooks'

import { RecipeItem } from './recipe-item'

export type FireRecipesProps = {
  setError: (error: string | null) => void
}

export const FireRecipesColumn: React.FC<FireRecipesProps> = ({ setError }) => {
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
        <BookSelector />
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

const BookSelector = () => {
  const user = useAppSelector(fromAuth.selectAuthorizedUser)
  if (!user) return null

  // const dispatch = useAppDispatch()
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [allBooks, updateBooks] = useState(['book1', 'book2', 'book3'])

  const refreshBooks = () => {
    // setError(null)
    // dispatch(fromRecipes.fetchRecipes()).catch((err) => setError(err.message))
    // eslint-disable-next-line no-console
    console.log('Books fetched')
  }

  const createBook = (title: string) => {
    // setError(null)
    // dispatch(fromRecipes.fetchRecipes()).catch((err) => setError(err.message))
    updateBooks((books) => [...books, title])

    // eslint-disable-next-line no-console
    console.log(`Book created: ${title}`)
  }

  const deleteBook = (book: string) => {
    // setError(null)
    // dispatch(fromRecipes.fetchRecipes()).catch((err) => setError(err.message))
    updateBooks((books) => books.filter((b) => b !== book))

    // eslint-disable-next-line no-console
    console.log(`Book deleted: ${book}`)
  }

  const selectBook = (book: string | null) => {
    // setError(null)
    // dispatch(fromRecipes.fetchRecipes()).catch((err) => setError(err.message))
    setSelectedBook(book)

    // eslint-disable-next-line no-console
    console.log(`Book selected: ${book}`)
  }

  const handleOpenDialog = () => {
    const dialog = dialogRef.current
    if (dialog == null) return

    refreshBooks()
    dialog.showModal()
  }

  const handleCloseDialog: MouseEventHandler<HTMLDialogElement> = (event) => {
    event.preventDefault()

    const dialog = dialogRef.current
    if (dialog == null) return

    const rect = dialog.getBoundingClientRect()
    const { clientX, clientY } = event
    const clickedInDialog =
      rect.top <= clientY &&
      clientY <= rect.top + rect.height &&
      rect.left <= clientX &&
      clientX <= rect.left + rect.width

    if (!clickedInDialog) dialog.close()
  }

  const handleSelectBook = (book: string) => () => {
    dialogRef.current?.close()
    selectBook(book)
  }

  const handleDeleteBook = (book: string) => () => {
    dialogRef.current?.close()
    if (selectedBook === book) setSelectedBook(null)
    deleteBook(book)
  }

  const handleAddBook: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()

    const input = inputRef.current
    if (input == null) return
    const book = input.value
    input.value = ''

    dialogRef.current?.close()
    createBook(book)
    selectBook(book)
  }

  return (
    <div className="dropdown stretch">
      <button
        className={`dropdown-button ${selectedBook ? 'selected' : 'empty'}`}
        type="button"
        onClick={handleOpenDialog}
      >
        {selectedBook ?? 'Select a book'}
      </button>
      <dialog ref={dialogRef} className="dropdown-dialog" onClick={handleCloseDialog}>
        <div className="dropdown-content">
          <h3>Please select a book</h3>
          {allBooks.sort().map((book) => (
            <div className="dropdown-choice" key={book}>
              <span className="dropdown-text clickable" onClick={handleSelectBook(book)}>
                {book}
              </span>
              <button className="dropdown-action icon" type="button" onClick={handleDeleteBook(book)}>
                -
              </button>
            </div>
          ))}
          <form className="dropdown-choice" onSubmit={(e) => handleAddBook(e)}>
            <input className="dropdown-input" type="text" ref={inputRef} required />
            <button className="dropdown-action icon" type="submit">
              +
            </button>
          </form>
        </div>
      </dialog>
    </div>
  )
}
