const groupText = 'reactive-devtools'
const groupStyle = 'background-color: blue; color: white; border-radius: 0.5rem'
const keyStyle = 'font-weight: bold'
const defaultStyle = ''

export function trace(key: string, message: unknown, ...more: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('%c %s %c %s: %c%s', groupStyle, groupText, keyStyle, key, defaultStyle, message, ...more)
}
