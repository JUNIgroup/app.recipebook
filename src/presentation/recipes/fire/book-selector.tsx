/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import React, { MouseEventHandler, ReactEventHandler, useRef } from 'react'
import { ulid } from 'ulid'
import * as fromAuth from '../../../business/auth'
import { RecipeBook } from '../../../business/recipe-books/model'
import * as fromRecipeBooks from '../../../business/recipe-books/store'
import { useAppDispatch, useAppSelector } from '../../store.hooks'

export type BookSelectorProps = {
  setError: (error: string | null) => void
  selectedBookId: string | null
  onSelectBookId: (bookId: string | null) => void
}

export const BookSelector: React.FC<BookSelectorProps> = ({ setError, selectedBookId, onSelectBookId }) => {
  const user = useAppSelector(fromAuth.selectAuthorizedUser)
  if (!user) return null

  const dispatch = useAppDispatch()
  const selectedBook = useAppSelector((state) => fromRecipeBooks.selectRecipeBookById(state, selectedBookId ?? ''))
  const allBooks = useAppSelector(fromRecipeBooks.selectRecipeBooksSortedByTitle)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const refreshBooks = async () => {
    setError(null)
    try {
      await dispatch(fromRecipeBooks.refreshRecipeBooks())
      // eslint-disable-next-line no-console
      console.log('Books fetched')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const createBook = async (title: string) => {
    setError(null)
    try {
      const book: RecipeBook = {
        id: ulid(),
        version: 1,
        rev: 0,
        title,
        subtitle: `created at ${new Date().toLocaleString()}`,
      }
      await dispatch(fromRecipeBooks.addRecipeBook(book))
      // eslint-disable-next-line no-console
      console.log(`Book created: ${title}`)
      return book
    } catch (err) {
      setError((err as Error).message)
      return null
    }
  }

  const deleteBook = async (book: RecipeBook) => {
    setError(null)
    try {
      await dispatch(fromRecipeBooks.deleteRecipeBook(book.id))
      // eslint-disable-next-line no-console
      console.log(`Book deleted: ${book.title}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const selectBook = (book: RecipeBook | null) => {
    if (book == null) {
      onSelectBookId(null)
      return
    }

    // dispatch(fromRecipes.fetchRecipes()).catch((err) => setError(err.message))
    onSelectBookId(book.id)

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
    if (selectedBookId === book.id) onSelectBookId(null)
    deleteBook(book)
  }

  const handleAddBook: ReactEventHandler = (event) => {
    event.preventDefault()

    const input = inputRef.current
    if (input == null) return
    const title = input.value
    input.value = ''

    dialogRef.current?.close()
    createBook(title).then((book) => selectBook(book))
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
          <form className="dropdown-choice" onSubmit={handleAddBook}>
            <input className="dropdown-input" type="text" ref={inputRef} required />
            <button className="dropdown-action icon" type="button" onClick={handleAddBook}>
              +
            </button>
          </form>
        </div>
      </dialog>
    </div>
  )
}
