const headerHeight = 64

let scrollContainer: HTMLElement
let tippingPoints: [string, number][]
let vw: number
let vh: number
let scrollbarWidth: number
let splashOffset: number

/**
 * Register a event listeners that sets the scroll variable to the percentage of the screen that has been scrolled.
 *
 * @returns A function that removes all event listeners.
 */
export function registerScrollEvent() {
  scrollContainer = document.querySelector('#root') as HTMLElement
  tippingPoints = getTippingPoints()
  window.addEventListener('scroll', setScrollVariable)
  window.addEventListener('resize', setSize)
  setSize()
  return () => {
    window.removeEventListener('resize', setSize)
    window.removeEventListener('scroll', setScrollVariable)
  }
}

function getTippingPoints() {
  const cssTippingPoints = window.getComputedStyle(scrollContainer).getPropertyValue('--tp') ?? ''
  return cssTippingPoints
    .split(',')
    .map((tp) => tp.split(':'))
    .map((tp) => [tp[0].trim(), parseFloat(tp[1])] as [string, number])
    .filter((tp) => !Number.isNaN(tp[1]))
}

function setSize() {
  vw = window.innerWidth
  vh = window.innerHeight
  splashOffset = Math.max(0, vh - headerHeight)
  scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

  // see index.scss for the values
  const logoSizeLarge = clamp(64, Math.min((1 - 2 * 0.12) * vw, ((1 - 2 * 0.06) / 2) * vh), 300)

  scrollContainer.style.setProperty('--vh', `${window.innerHeight}`)
  scrollContainer.style.setProperty('--vw', `${window.innerWidth}`)
  scrollContainer.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`)
  scrollContainer.style.setProperty('--logo-size-large-unit', `${logoSizeLarge}`)
  setScrollVariable()
}

function setScrollVariable() {
  const scrollNext = document.documentElement.scrollTop
  const percentOfScreenHeightScrolled = (100 * scrollNext) / vh
  scrollContainer.style.setProperty('--scroll', percentOfScreenHeightScrolled.toString())
  scrollContainer.classList.toggle('splash-animation', scrollNext < splashOffset)
  tippingPoints.forEach(([name, value]) => {
    scrollContainer.classList.toggle(name, percentOfScreenHeightScrolled >= value)
  })
}

function clamp(min: number, value: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
