import { byString, byText } from './redux-selector-helper'

function permute<T>(array: T[], n = array.length): T[][] {
  if (n === 1) {
    return [array]
  }
  const result: T[][] = []
  for (let i = 0; i < n; i += 1) {
    const subArray = [...array]
    const selected = subArray.splice(i, 1)
    permute(subArray).forEach((subPermutation) => result.push(selected.concat(subPermutation)))
  }
  return result
}

const permutations = permute(['b', 'aaaaa', 'aaa', 'AA', 'ä', 'æ', 'å'])

describe('byString', () => {
  it('should be compare string by unicode %s', () => {
    permutations.forEach((permutation) => {
      const strings = [...permutation]
      strings.sort(byString((str) => str))
      expect({ permutation, strings }).toEqual({ permutation, strings: ['AA', 'aaa', 'aaaaa', 'b', 'ä', 'å', 'æ'] })
    })
  })
})

describe('byText', () => {
  it('should be compare string by locales (en)', () => {
    permutations.forEach((permutation) => {
      const strings = [...permutation]
      strings.sort(byText((str) => str, 'en'))
      expect({ permutation, strings }).toEqual({ permutation, strings: ['å', 'ä', 'AA', 'aaa', 'aaaaa', 'æ', 'b'] })
    })
  })

  it('should be compare string by locales (dk)', () => {
    permutations.forEach((permutation) => {
      const strings = [...permutation]
      strings.sort(byText((str) => str, 'dk', { caseFirst: 'upper' }))
      expect({ permutation, strings }).toEqual({ permutation, strings: ['å', 'ä', 'AA', 'aaa', 'aaaaa', 'æ', 'b'] })
    })
  })
})
