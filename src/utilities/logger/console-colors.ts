import { detectColorMode } from './browser-detect'
/**
 * middle colors, good visible on both 'light' and 'dark' screens
 */
export const middleColors =
  '06c06f09009309609909c36936c36f39039339639939c66366966c66f69069369669969c90f93c93f96096396696996c96f990993c00c03c06c09c0cc0fc30c33c36c39c3cc3fc60c63c66c69c6cc6ff00f03f06f09f0cf0ff30f33f36f39f3c'

/**
 * dark colors, only good visible on 'light' screens
 */
export const darkColors =
  '00300600900c00f03003303603903c03f06006306606930030330630930c30f33033633933c33f36036336660060360660960c60f63063363663963c63f66090090390690990c930933936939'

/**
 * light colors, only good visible on 'dark' screens
 */
export const lightColors =
  '09f0c00c30c60c90cc0cf0f00f30f60f90fc0ff39f3c03c33c63c93cc3cf3f03f33f63f93fc3ff69f6c06c36c66c96cc6cf6f06f36f66f96fc6ff99699c99f9c09c39c69c99cc9cf9f09f39f69f99fc9ffc90c93c96c99c9cc9fcc0cc3cc6cc9ccfcf0cf3cf6cf9cfccfff3ff60f63f66f69f6cf6ff90f93f96f99f9cf9ffc0fc3fc6fc9fccfcfff0ff3ff6ff9ffc'

/**
 * A gray color that has the best contrast ratio with both light and dark colors
 *
 * Contrast ratio to white: 4.61
 * Contrast ratio to black: 4.56
 *
 * @see https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 * @see https://contrastchecker.online
 */
export const middleGray = '#757575'

/**
 * Computes a distributed hash code for the given string.
 *
 * It use the djb2 algorithm.
 *
 * @param str The string to hash.
 *
 * @see https://stackoverflow.com/a/7616484/1123955
 * @see http://www.cse.yorku.ca/~oz/hash.html
 */
function hashCode(str: string): number {
  /* eslint-disable no-bitwise */
  let hash = 5381
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) + hash + str.charCodeAt(i) // hash * 33 + c
    hash |= 0 // Convert to 32bit integer
  }
  return hash & 0x7fffffff
  /* eslint-enable no-bitwise */
}

/**
 * Assign a color to the given string.
 *
 * - The color is based on the hash of the string.
 * - The same string will always get the same color.
 * - The possible colors depending on the current browser theme.
 *
 * @param str The string to hash
 * @param moreColors additional colors to use, auto detected if not provided
 */
export function getHashColor(
  str: string,
  moreColors: string = detectColorMode({ light: darkColors, dark: lightColors, other: '' }),
): string {
  const hash = hashCode(str)
  const index = (hash % ((middleColors.length + moreColors.length) / 3)) * 3
  return index < moreColors.length
    ? `#${moreColors.substring(index, index + 3)}`
    : `#${middleColors.substring(index - moreColors.length, index - moreColors.length + 3)}`
}

type StyleParams = {
  namespace: string

  /** color in format #rgb or #rrggbb or as name */
  namespaceColor: string

  /** use more styles for chrome */
  chrome: boolean
}

export function styleConsoleLog({ namespace, namespaceColor, chrome }: StyleParams): unknown[] {
  if (chrome) {
    // chrome allows to split namespace into scope and name and filter by combined string
    const colon = namespace.indexOf(':')
    if (colon > 0 && colon < namespace.length - 1) {
      const scope = namespace.substring(0, colon) // include colon
      const name = namespace.substring(colon + 1)
      const template = `%c%s:%c%s %c%s`
      const scopeStyle = `color:${namespaceColor};font-weight:light`
      const nameStyle = `color:${namespaceColor};font-weight:bold`
      const messageStyle = '' // reset style
      const args = [template, scopeStyle, scope, nameStyle, name, messageStyle]
      return args
    }
  }

  // firefox does not allow to filter by combined string if scope and name are using different styles
  // if namespace is not split into scope and name, use the whole namespace as name
  const template = `%c%s %c%s`
  const namespaceStyle = `color:${namespaceColor};font-weight:bold`
  const messageStyle = '' // reset style
  const args = [template, namespaceStyle, namespace, messageStyle]
  return args
}
