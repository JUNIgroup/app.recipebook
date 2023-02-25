import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Action } from 'redux'
import { actionError } from './redux-action-helper'

describe('actionError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should log error for action with payload', () => {
    const action: PayloadAction<unknown> = { type: 'test/error', payload: { key: 'value' } }
    actionError(action, 'an-error')
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('an-error'), expect.any(String), {
      key: 'value',
    })
  })

  it('should log error for action without payload', () => {
    const action: Action = { type: 'test/error' }
    actionError(action, 'an-error')
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('an-error'), expect.any(String), undefined)
  })

  it('should log nice error with slice actions', () => {
    const testSlice = createSlice({
      name: 'unit-test',
      initialState: { bar: true },
      reducers: {
        /** set/reset the value for the email to remember for next login */
        foo(state, action: PayloadAction<{ bar: boolean }>) {
          // eslint-disable-next-line no-param-reassign
          state.bar = action.payload.bar
        },
      },
    })

    const action: Action = testSlice.actions.foo({ bar: false })
    actionError(action, 'Foo Bar!')
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/skip action "unit-test\/foo": Foo Bar!/),
      expect.any(String),
      { bar: false },
    )
  })
})
