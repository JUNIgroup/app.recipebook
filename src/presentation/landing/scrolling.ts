/**
 * Register a event listeners that sets the scroll variable to the percentage of the screen that has been scrolled.
 *
 * @returns A function that removes all event listeners.
 */
export function registerScrollEvent() {
  window.addEventListener('scroll', setScrollVariables)
  window.addEventListener('resize', setScrollVariables)
  setScrollVariables()
  return () => {
    window.removeEventListener('resize', setScrollVariables)
    window.removeEventListener('scroll', setScrollVariables)
  }
}

function setScrollVariables() {
  const htmlElement = document.documentElement
  const percentOfScreenHeightScrolled = (100 * htmlElement.scrollTop) / htmlElement.clientHeight
  htmlElement.style.setProperty('--scroll', Math.min(100, percentOfScreenHeightScrolled).toString())
}
