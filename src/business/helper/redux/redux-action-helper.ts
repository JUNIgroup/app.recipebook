import type { Action } from 'redux'

/** Logs as error to the console, the error from applying the action. */
export function actionError(action: Action, message: string) {
  const payload = 'payload' in action ? action.payload : undefined
  // eslint-disable-next-line no-console
  console.error(`skip action "${action.type}": ${message}\n%cpayload = %O`, 'color: gray; margin-left: 2rem', payload)
}
