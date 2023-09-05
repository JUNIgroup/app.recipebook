/* eslint-disable @typescript-eslint/no-use-before-define */

import { Component, For, JSX, createMemo } from 'solid-js'
import { ulid } from 'ulid'
import { useRecipeBooksContext } from '../../../business/recipe-books/context/recipe-books-context'
import { RecipeBook } from '../../../business/recipe-books/model'
import { logMount } from '../../utils/log-mount'

export type BookSelectorProps = {
  setError: (error: string | null) => void
  selectedBookId: string | null
  onSelectBookId: (bookId: string | null) => void
}

export const BookSelector: Component<BookSelectorProps> = (props) => {
  logMount('BookSelector')

  const { selectRecipeBookById, selectRecipeBooksSortedByTitle, deleteRecipeBook, addRecipeBook, refreshRecipeBooks } =
    useRecipeBooksContext()

  const selectedBook = () => selectRecipeBookById(props.selectedBookId)
  const allBooks = createMemo(() => selectRecipeBooksSortedByTitle())

  let inputRef: HTMLInputElement | undefined
  let dialogRef: HTMLDialogElement | undefined

  const refreshBooks = async () => {
    props.setError(null)
    try {
      await refreshRecipeBooks()
      // eslint-disable-next-line no-console
      console.log('Books fetched')
    } catch (err) {
      props.setError((err as Error).message)
    }
  }

  const createBook = async (title: string) => {
    props.setError(null)
    try {
      const recipeBook: RecipeBook = {
        id: ulid(),
        version: 1,
        rev: 0,
        title,
        subtitle: `created at ${new Date().toLocaleString()}`,
      }
      await addRecipeBook(recipeBook)
      // eslint-disable-next-line no-console
      console.log(`Book created: ${title}`)
      return recipeBook
    } catch (err) {
      props.setError((err as Error).message)
      return null
    }
  }

  const deleteBook = async (book: RecipeBook) => {
    props.setError(null)
    try {
      const deleted = await deleteRecipeBook(book.id)
      // eslint-disable-next-line no-console
      console.log(`Book deleted: ${book.title} (${deleted ? '✔️' : '-'})`)
    } catch (err) {
      props.setError((err as Error).message)
    }
  }

  const selectBook = (book: RecipeBook | null) => {
    if (book == null) {
      props.onSelectBookId(null)
      return
    }

    props.onSelectBookId(book.id)

    // eslint-disable-next-line no-console
    console.log(`Book selected: ${book.title}`)
  }

  const handleOpenDialog = () => {
    if (dialogRef == null) return

    refreshBooks()
    dialogRef.showModal()
  }

  const handleCloseDialog: JSX.EventHandler<HTMLDialogElement, MouseEvent> = (event) => {
    event.preventDefault()

    if (dialogRef == null) return

    const rect = dialogRef.getBoundingClientRect()
    const { clientX, clientY } = event
    const clickedInDialog =
      rect.top <= clientY &&
      clientY <= rect.top + rect.height &&
      rect.left <= clientX &&
      clientX <= rect.left + rect.width

    if (!clickedInDialog) dialogRef.close()
  }

  const handleSelectBook = (book: RecipeBook) => {
    dialogRef?.close()
    selectBook(book)
  }

  const handleDeleteBook = (book: RecipeBook) => {
    dialogRef?.close()
    if (props.selectedBookId === book.id) props.onSelectBookId(null)
    deleteBook(book)
  }

  const handleAddBook = async (event: Event) => {
    event.preventDefault()

    if (inputRef == null) return
    const title = inputRef.value
    inputRef.value = ''

    dialogRef?.close()
    const book = await createBook(title)
    selectBook(book)
  }

  return (
    <div class="dropdown stretch">
      <button
        class="dropdown-button"
        classList={{ selected: !!props.selectedBookId, empty: !props.selectedBookId }}
        type="button"
        onClick={handleOpenDialog}
      >
        {selectedBook()?.title ?? 'Select a book'}
      </button>
      <dialog ref={dialogRef} class="dropdown-dialog" onClick={handleCloseDialog}>
        <div class="dropdown-content">
          <h3>Please select a book</h3>
          <For each={allBooks()}>
            {(book) => (
              <div class="dropdown-choice">
                <span class="dropdown-text clickable" onClick={() => handleSelectBook(book)}>
                  {book.title}
                </span>
                <button class="dropdown-action icon" type="button" onClick={() => handleDeleteBook(book)}>
                  -
                </button>
              </div>
            )}
          </For>
          <form class="dropdown-choice" onSubmit={handleAddBook}>
            <input class="dropdown-input" type="text" ref={inputRef} required />
            <button class="dropdown-action icon" type="button" onClick={handleAddBook}>
              +
            </button>
          </form>
        </div>
      </dialog>
    </div>
  )
}
