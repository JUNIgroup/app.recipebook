/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import { FormEventHandler, MouseEventHandler, useRef, useState } from 'react'
import * as fromAuth from '../../../business/auth'
import * as fromRecipeBooks from '../../../business/recipe-books/store'
import { useAppSelector } from '../../store.hooks'
import { RecipeBook } from '../../../business/recipe-books/model'
import { ID } from '../../../infrastructure/database/rdb.service'

export type BookSelectorProps = {
  setError: (error: string | null) => void
}

export const BookSelector: React.FC<BookSelectorProps> = ({ setError }) => {
  const user = useAppSelector(fromAuth.selectAuthorizedUser)
  if (!user) return null

  // const dispatch = useAppDispatch()

  const [selectedBookId, setSelectedBookId] = useState<ID | null>(null)
  const selectedBook = useAppSelector((state) => fromRecipeBooks.selectRecipeBookById(state, selectedBookId))
  const allBooks = useAppSelector(fromRecipeBooks.selectAllRecipeBooksSortedByTitle)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const refreshBooks = () => {
    setError(null)
    // dispatch(fromRecipes.fetchRecipes()).catch((err) => setError(err.message))
    // eslint-disable-next-line no-console
    console.log('Books fetched')
  }

  const createBook = (title: string) => {
    setError(null)
    // dispatch(fromRecipes.fetchRecipes()).catch((err) => setError(err.message))
    // updateBooks((books) => [...books, title])

    // eslint-disable-next-line no-console
    console.log(`Book created: ${title}`)
  }

  const deleteBook = (book: RecipeBook) => {
    setError(null)
    // dispatch(fromRecipes.fetchRecipes()).catch((err) => setError(err.message))
    // updateBooks((books) => books.filter((b) => b !== book))

    // eslint-disable-next-line no-console
    console.log(`Book deleted: ${book}`)
  }

  const selectBook = (book: RecipeBook | null) => {
    if (book == null) {
      setSelectedBookId(null)
      return
    }

    // dispatch(fromRecipes.fetchRecipes()).catch((err) => setError(err.message))
    setSelectedBookId(book.id)

    // eslint-disable-next-line no-console
    console.log(`Book selected: ${book.title}`)
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

  const handleSelectBook = (book: RecipeBook) => () => {
    dialogRef.current?.close()
    selectBook(book)
  }

  const handleDeleteBook = (book: RecipeBook) => () => {
    dialogRef.current?.close()
    if (selectedBookId === book.id) setSelectedBookId(null)
    deleteBook(book)
  }

  const handleAddBook: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()

    const input = inputRef.current
    if (input == null) return
    const title = input.value
    input.value = ''

    dialogRef.current?.close()
    createBook(title)
    // selectBook(book)
  }

  return (
    <div className="dropdown stretch">
      <button
        className={`dropdown-button ${selectedBookId ? 'selected' : 'empty'}`}
        type="button"
        onClick={handleOpenDialog}
      >
        {selectedBook?.title ?? 'Select a book'}
      </button>
      <dialog ref={dialogRef} className="dropdown-dialog" onClick={handleCloseDialog}>
        <div className="dropdown-content">
          <h3>Please select a book</h3>
          {allBooks.sort().map((book) => (
            <div className="dropdown-choice" key={book.id}>
              <span className="dropdown-text clickable" onClick={handleSelectBook(book)}>
                {book.title}
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
