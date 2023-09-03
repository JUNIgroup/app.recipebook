import { Owner, createEffect, onCleanup, runWithOwner, untrack } from 'solid-js'
import { Action, getReduxExtension } from './extension'
import { trace } from './utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ANY = any

export type FullOptions = {
  owner: Owner
  name: string
  toState: () => unknown
  fromState?: (jsonString: ANY) => void
}

let nextAction: Action | undefined

export function setNextAction(action: string, payload: unknown) {
  nextAction = { type: action, payload }
}

function getLastAction(name: string) {
  const action = nextAction ?? { type: name }
  nextAction = undefined
  return action
}

export function reactiveDevTools({ owner, name, toState, fromState }: FullOptions) {
  const extension = getReduxExtension()
  if (extension == null) return

  let setByDevtool = false

  runWithOwner(owner, () => {
    trace(name, 'connect')
    const devTools = extension.connect({
      name,
      maxAge: 50,
      features: {
        pause: false,
        lock: false,
        persist: false,
        export: false,
        import: false,
        jump: fromState != null,
        skip: false,
        reorder: false,
        dispatch: false,
        test: false,
      },
    })
    let initValue: undefined | string

    if (fromState) {
      const setState = (state: unknown) => {
        try {
          setByDevtool = true
          fromState(state)
        } catch (error) {
          // ignore
        } finally {
          setByDevtool = false
        }
        return state
      }
      devTools.subscribe((message) => {
        if (message.type === 'DISPATCH' && message.payload) {
          switch (message.payload.type) {
            case 'RESET':
              if (initValue) {
                devTools.init(setState(JSON.parse(initValue)))
              }
              break
            case 'COMMIT':
              devTools.init(untrack(toState))
              break
            case 'ROLLBACK':
              devTools.init(setState(JSON.parse(message.state)))
              break
            case 'JUMP_TO_STATE':
            case 'JUMP_TO_ACTION':
              setState(JSON.parse(message.state))
              break
            default:
              trace(name, message.payload.type, 'skip')
              return
          }
          trace(name, message.payload.type)
        }
      })
    }

    createEffect(() => {
      const value = toState()
      const action = getLastAction(name)
      if (initValue === undefined) {
        trace(name, 'init', value)
        initValue = JSON.stringify(value)
        devTools.init(value)
      } else if (!setByDevtool) {
        devTools.send(action, value)
      }
    })

    onCleanup(() => {
      trace(name, 'disconnect')
      if (fromState) {
        devTools.unsubscribe()
      }
    })
  })
}
