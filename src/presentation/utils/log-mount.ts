/* eslint-disable no-console */
import { onCleanup, onMount } from 'solid-js'

export function logMount(componentName: string) {
  if (import.meta.env.DEV) {
    onMount(() => {
      console.log('%c MOUNT %c %s', 'background-color: green', '', componentName)
    })
    onCleanup(() => {
      console.log('%c CLEAN %c %s', 'background-color: red', '', componentName)
    })
  }
}
