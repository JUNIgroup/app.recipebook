/* eslint-disable no-console */
import { onCleanup, onMount } from 'solid-js'

export function logMount(componentName: string) {
  if (import.meta.env.DEV) {
    onMount(() => {
      console.log('%cMOUNT%c %s', 'background-color: green', '', componentName)
    })
    onCleanup(() => {
      console.log('%cCLEAN%c %s', 'background-color: red', '', componentName)
    })
  }
}
