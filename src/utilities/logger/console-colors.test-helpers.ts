/**
 * We avoid computation the color palettes in production code.
 * Therefore we computation them in the test code and use them as constants in the production code.
 */

/**
 * Get the relative luminance of a color.
 *
 * @param hexColor color in format '#rgb' or '#rrggbb'
 * @returns luminance in range [0, 1]
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 * @see https://contrastchecker.online/color-relative-luminance-calculator
 */
export function relativeLuminance(color: string) {
  const hexColor = color.replace('#', '')
  const v1 = (str: string) => parseInt(str + str, 16) / 255
  const v2 = (str: string) => parseInt(str, 16) / 255
  const [r, g, b] =
    hexColor.length === 6
      ? [v2(hexColor.substring(0, 2)), v2(hexColor.substring(2, 4)), v2(hexColor.substring(4, 6))]
      : [v1(hexColor.substring(0, 1)), v1(hexColor.substring(1, 2)), v1(hexColor.substring(2, 3))]
  const R = r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4
  const G = g <= 0.03928 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4
  const B = b <= 0.03928 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4
  const L = 0.2126 * R + 0.7152 * G + 0.0722 * B
  return L
}

/**
 * Get the contrast ratio between two colors.
 *
 * @param color1 first color in format '#rgb' or '#rrggbb'
 * @param color2 second color in format '#rgb' or '#rrggbb'
 * @returns the contrast ratio in range [1, 21]
 * @see https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 * @see https://contrastchecker.online
 */
export function contrastRatio(color1: string, color2: string) {
  const l1 = relativeLuminance(color1)
  const l2 = relativeLuminance(color2)
  const brightest = Math.max(l1, l2)
  const darkest = Math.min(l1, l2)
  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Convert a color strings (all color values in a row) to an array of colors.
 *
 * @param colors the color string to split
 * @param length the length of each color
 * @returns the colors in format '#rgb' (length 3) or '#rrggbb' (length 6)
 */
export function splitColors(colors: string, length: number) {
  return (colors.match(new RegExp(`.{${length}}`, 'g')) ?? []).map((c) => `#${c}`)
}

/**
 * Convert an array of colors to a color string (all color values in a row).
 *
 * @param colors the colors to join
 * @returns the string of all colors ignoring the '#' prefix
 */
export function joinColors(colors: string[]) {
  return colors.map((c) => c.replace('#', '')).join('')
}
