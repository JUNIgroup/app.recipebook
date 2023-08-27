import { Context, EffectOptions, useContext } from 'solid-js'

export function useExistingContext<T>(contextDefinition: Context<T>, options: EffectOptions) {
  return () => {
    const context = useContext(contextDefinition)
    if (context) return context
    throw new Error(`useExistingContext: context "${options.name}" not found`)
  }
}
