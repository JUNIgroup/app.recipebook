/* eslint-disable no-console */
import { darkColors, getHashColor, lightColors, middleColors, middleGray, styleConsoleLog } from './console-colors'
import { contrastRatio, joinColors, relativeLuminance, splitColors } from './console-colors.test-helpers'

describe('test-helpers', () => {
  describe('relativeLuminance', () => {
    it.each`
      color        | name       | luminance
      ${'#ffffff'} | ${'white'} | ${1}
      ${'ffffff'}  | ${'white'} | ${1}
      ${'#fff'}    | ${'white'} | ${1}
      ${'fff'}     | ${'white'} | ${1}
      ${'#000000'} | ${'black'} | ${0}
      ${'000000'}  | ${'black'} | ${0}
      ${'#000'}    | ${'black'} | ${0}
      ${'000'}     | ${'black'} | ${0}
      ${'#808080'} | ${'gray'}  | ${0.216}
      ${'#888'}    | ${'gray'}  | ${0.246}
      ${'#ff0000'} | ${'red'}   | ${0.2126}
    `(`should return $luminance for $name ($color)`, ({ color, luminance }) => {
      // see https://contrastchecker.online/color-relative-luminance-calculator
      // see https://www.w3.org/TR/WCAG20/#relativeluminancedef

      // act
      const result = relativeLuminance(color)

      // assert
      expect(result).toBeCloseTo(luminance, 3)
    })
  })

  describe('contrast', () => {
    it.each`
      color1       | name1      | color2       | name2      | contrast
      ${'#fff'}    | ${'white'} | ${'#000'}    | ${'black'} | ${21}
      ${'#ffffff'} | ${'white'} | ${'#000000'} | ${'black'} | ${21}
      ${'#000000'} | ${'black'} | ${'#ffffff'} | ${'white'} | ${21}
      ${'#00ffff'} | ${'cyan'}  | ${'#00ffff'} | ${'cyan'}  | ${1}
      ${'#ffffff'} | ${'white'} | ${'#888888'} | ${'gray'}  | ${3.54}
      ${'#ffffff'} | ${'white'} | ${'#ff0000'} | ${'red'}   | ${3.998}
      ${'#000000'} | ${'black'} | ${'#888888'} | ${'gray'}  | ${5.92}
      ${'#000000'} | ${'black'} | ${'#ff0000'} | ${'red'}   | ${5.25}
      ${'#ff0000'} | ${'red'}   | ${'#00ff00'} | ${'green'} | ${2.91}
    `(`should return $contrast for $name1 ($color1) vs. $name2 ($color2)`, ({ color1, color2, contrast }) => {
      // see https://contrastchecker.online
      // see https://www.w3.org/TR/WCAG20/#contrast-ratiodef

      // act
      const result = contrastRatio(color1, color2)

      // assert
      expect(result).toBeCloseTo(contrast, 2)
    })
  })

  describe('splitColors', () => {
    it('should split a string of colors (rrggbb) into an array of colors', () => {
      // arrange
      const colors = 'ffffff000000808080ff0000'

      // act
      const result = splitColors(colors, 6)

      // assert
      expect(result).toEqual(['#ffffff', '#000000', '#808080', '#ff0000'])
    })

    it('should split a string of colors (rgb) into an array of colors', () => {
      // arrange
      const colors = 'fff000888f00'

      // act
      const result = splitColors(colors, 3)

      // assert
      expect(result).toEqual(['#fff', '#000', '#888', '#f00'])
    })
  })

  describe('joinColors', () => {
    it('should join an array of colors into a string of colors (rrggbb)', () => {
      // arrange
      const colors = ['#ffffff', '#000000', '#808080', '#ff0000']

      // act
      const result = joinColors(colors)

      // assert
      expect(result).toEqual('ffffff000000808080ff0000')
    })

    it('should join an array of colors into a string of colors (rgb)', () => {
      // arrange
      const colors = ['#fff', '#000', '#888', '#f00']

      // act
      const result = joinColors(colors)

      // assert
      expect(result).toEqual('fff000888f00')
    })
  })
})

const LIGHT_REF_COLOR = '#ffffff'
const LIGHT_MIN_CONTRAST = 3
const DARK_REF_COLOR = '#000000'
const DARK_MIN_CONTRAST = 3.5

describe('pre-computed color palettes', () => {
  function computeColors() {
    const result = {
      gray: [] as string[],
      dark: [] as string[],
      light: [] as string[],
      middle: [] as string[],
    }
    const hex = ['0', '3', '6', '9', 'c', 'f']
    hex.forEach((r) => {
      hex.forEach((g) => {
        hex.forEach((b) => {
          const color = `#${r}${g}${b}`
          if (r === g && g === b) {
            result.gray.push(color)
          } else if (contrastRatio(color, DARK_REF_COLOR) < DARK_MIN_CONTRAST) {
            result.dark.push(color)
          } else if (contrastRatio(color, LIGHT_REF_COLOR) < LIGHT_MIN_CONTRAST) {
            result.light.push(color)
          } else {
            result.middle.push(color)
          }
        })
      })
    })
    return result
  }

  it(`should middleColors the same as the computed colors with contrast to dark >= ${DARK_MIN_CONTRAST} and to light >= ${LIGHT_MIN_CONTRAST}`, () => {
    // arrange
    const computedColors = computeColors().middle
    const computedString = joinColors(computedColors)

    // act
    const colors = splitColors(middleColors, 3)
    if (middleColors !== computedString) {
      console.log('actual string  :', middleColors)
      console.log('computed string:', computedString)
    }

    // assert
    expect(colors).toEqual(computedColors)
  })

  it(`should darkColors the same as the computed colors with contrast to dark < ${DARK_MIN_CONTRAST} and to light >= ${LIGHT_MIN_CONTRAST}`, () => {
    // arrange
    const computedColors = computeColors().dark
    const computedString = joinColors(computedColors)

    // act
    const colors = splitColors(darkColors, 3)
    if (darkColors !== computedString) {
      console.log('actual string  :', darkColors)
      console.log('computed string:', computedString)
    }

    // assert
    expect(colors).toEqual(computedColors)
  })

  it(`should lightColors the same as the computed colors with contrast to dark >= ${DARK_MIN_CONTRAST} and to light < ${LIGHT_MIN_CONTRAST}`, () => {
    // arrange
    const computedColors = computeColors().light
    const computedString = joinColors(computedColors)

    // act
    const colors = splitColors(lightColors, 3)
    if (lightColors !== computedString) {
      console.log('actual string  :', lightColors)
      console.log('computed string:', computedString)
    }

    // assert
    expect(colors).toEqual(computedColors)
  })
})

describe('colors', () => {
  it('should all color arrays be distinct', () => {
    // arrange
    const intersection = (a: string[], b: string[]) => a.filter((x) => b.includes(x))
    const middle = splitColors(middleColors, 3)
    const dark = splitColors(darkColors, 3)
    const light = splitColors(lightColors, 3)

    // assert
    expect(intersection(light, middle), 'lightColors vs. middleColors').toEqual([])
    expect(intersection(dark, middle), 'darkColors vs. middleColors').toEqual([])
    expect(intersection(light, dark), 'lightColors vs. darkColors').toEqual([])
  })

  it.each`
    group       | colors
    ${'middle'} | ${splitColors(middleColors, 3)}
    ${'dark'}   | ${splitColors(darkColors, 3)}
  `(
    `should $group colors have a good contrast ratio (>=${LIGHT_MIN_CONTRAST}) to light background (${LIGHT_REF_COLOR})`,
    ({ colors }: { colors: string[] }) => {
      // act
      const badContrastColors = colors.filter((color) => contrastRatio(color, LIGHT_REF_COLOR) < LIGHT_MIN_CONTRAST)

      // assert
      expect(badContrastColors).toEqual([])
    },
  )

  it.each`
    group       | colors
    ${'light'}  | ${splitColors(lightColors, 3)}
    ${'middle'} | ${splitColors(middleColors, 3)}
  `(
    `should $group colors have a good contrast ratio (>=${DARK_MIN_CONTRAST}) to dark background (${DARK_REF_COLOR})`,
    ({ colors }: { colors: string[] }) => {
      // act
      const badContrastColors = colors.filter((color) => contrastRatio(color, DARK_REF_COLOR) < DARK_MIN_CONTRAST)

      // assert
      expect(badContrastColors).toEqual([])
    },
  )
})

describe('middleGray', () => {
  function grayWithAroundSameContrastDistanceToWhiteAndBlack() {
    let minDifference = 100000000000
    let bestColor = ''
    for (let g = 0; g < 256; g += 1) {
      const gray = g.toString(16).padStart(2, '0')
      const color = `#${gray}${gray}${gray}`
      const lightDistance = contrastRatio(color, LIGHT_REF_COLOR)
      const darkDistance = contrastRatio(color, DARK_REF_COLOR)
      const diffDistance = Math.abs(lightDistance - darkDistance)
      if (diffDistance < minDifference) {
        minDifference = diffDistance
        bestColor = color
      }
    }
    return bestColor
  }
  it('should the gray with the nearly same contrast distance to light and dark', () => {
    // arrange
    const expectedColor = grayWithAroundSameContrastDistanceToWhiteAndBlack()

    // assert
    expect(middleGray).toBe(expectedColor)
  })
})

describe('getHashColor', () => {
  it('should return a color in format #rgb', () => {
    // arrange
    const string = 'a string'

    // act
    const color = getHashColor(string)

    // assert
    expect(color).toMatch(/^#[0-9a-f]{3}$/)
  })

  it('should return the same color for the same string', () => {
    // arrange
    const string = 'some string'

    // act
    const color1 = getHashColor(string)
    const color2 = getHashColor(string)

    // assert
    expect(color1).toBe(color2)
  })

  it('should return different colors for different strings', () => {
    // arrange
    const string1 = 'some string'
    const string2 = 'some other string'

    // act
    const color1 = getHashColor(string1)
    const color2 = getHashColor(string2)

    // assert
    expect(color1).not.toBe(color2)
  })

  it('should return color from moreColor argument', () => {
    // arrange
    const string = 'a' // hash: 177670, index of substring: 201
    const moreColors = lightColors

    // act
    const color = getHashColor(string, moreColors)

    // assert
    const acceptedColors = splitColors(lightColors, 3)
    expect(acceptedColors).toContain(color)
  })

  it('should return color from baseColor argument', () => {
    // arrange
    const string = '~' // hash: 177699, index of substring: 288
    const moreColors = lightColors

    // act
    const color = getHashColor(string, moreColors)

    // assert
    const acceptedColors = splitColors(middleColors, 3)
    expect(acceptedColors).toContain(color)
  })
})

describe('styleConsoleLog', () => {
  it.each`
    namespace    | chrome   | description
    ${'foo'}     | ${true}  | ${'no split of namespace possible'}
    ${':foo'}    | ${true}  | ${'empty scope of namespace'}
    ${'foo:'}    | ${true}  | ${'empty name of namespace'}
    ${'foo:bar'} | ${false} | ${'no chrome'}
  `('should return prefix arguments to style console log (simple namespace, $description)', ({ namespace, chrome }) => {
    // arrange
    const namespaceColor = '#123456'
    const hintColor = '#654321'
    const hint = '«hint»'

    // act
    const styledString = styleConsoleLog({ namespace, namespaceColor, hint, hintColor, chrome })

    // assert
    expect(styledString).toEqual([
      `%c%s %c%s %c%s`, // styled hint, styled namespace and styled message
      `color:#654321;font-size:smaller`, // style for hint
      '«hint»', // hint instance
      `color:#123456;font-weight:bold`, // style for namespace
      namespace, // namespace text
      '', // reset style for message
    ])
  })

  it.each`
    namespace        | scope    | name
    ${'foo:bar'}     | ${'foo'} | ${'bar'}
    ${'foo:bar:baz'} | ${'foo'} | ${'bar:baz'}
  `(
    'should return prefix arguments to style console log (split namespace $namespace in chrome)',
    ({ namespace, scope, name }) => {
      // arrange
      const namespaceColor = '#123456'
      const hintColor = '#654321'
      const hint = '«hint»'
      const chrome = true

      // act
      const styledString = styleConsoleLog({ namespace, namespaceColor, hint, hintColor, chrome })

      // assert
      expect(styledString).toEqual([
        `%c%s %c%s:%c%s %c%s`, // styled scope of namespace, styled name of namespace and styled message
        `color:#654321;font-size:smaller`, // style for hint
        '«hint»', // hint instance
        `color:#123456;font-weight:light`, // style for scope of namespace
        scope, // scope text of namespace
        `color:#123456;font-weight:bold`, // style for name of namespace
        name, // name text of namespace
        '', // reset style for message
      ])
    },
  )
})
