import { useCallback, useState } from 'react'

export type PromiseResult<R> = {
  value?: R
  error?: unknown
  state: 'initial' | 'inProgress' | 'succeeded' | 'failed'
  inProgress: boolean
  succeeded: boolean
  failed: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const usePromiseHandler = <ARGS extends any[], R>(fn: (...args: ARGS) => Promise<R>) => {
  const [result, setResult] = useState<PromiseResult<R>>({
    state: 'initial',
    inProgress: false,
    succeeded: false,
    failed: false,
  })
  const handler = useCallback(
    (...args: ARGS) => {
      setResult({
        state: 'inProgress',
        inProgress: true,
        succeeded: false,
        failed: false,
      })
      fn(...args)
        .then((value) =>
          setResult({
            value,
            state: 'succeeded',
            inProgress: false,
            succeeded: true,
            failed: false,
          }),
        )
        .catch((error) => {
          setResult({
            error,
            state: 'failed',
            inProgress: false,
            succeeded: false,
            failed: true,
          })
        })
    },
    [fn],
  )
  const reset = useCallback(() => {
    setResult({
      state: 'initial',
      inProgress: false,
      succeeded: false,
      failed: false,
    })
  }, [])
  return { handler, result, reset }
}
