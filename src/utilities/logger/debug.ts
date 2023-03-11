/**
 * The value of the local storage key 'debug' defines, which loggers are enabled.
 *
 * - `debug` is a comma or space separated list of namespaces.
 * - You can use wildcard `*` in the namespace to enable loggers matching the pattern.
 * - You can start the namespace with `!` or '-' to disable loggers matching rest of the pattern.
 * - You can use `*` to enable all loggers.
 * - You can use `` to enable no logger.
 *
 * @example
 * - `debug=foo` enables the logger `foo`
 * - `debug=foo,bar` enables the loggers `foo` and `bar`
 * - `debug=foo bar` enables the loggers `foo` and `bar`
 * - `debug=foo:*` enables all loggers starting with `foo:`
 * - `debug=foo:* -foo:bar` enables all loggers starting with `foo:` except `foo:bar`
 * - `debug=*` enables all loggers
 * - `debug=` enables no logger
 */
export type DEBUG = string

function compilePattern(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, (char) => (char === '*' ? '.*?' : `\\${char}`))
  return new RegExp(`^${escaped}$`)
}

export type DebugMatcher = (namespace: string) => boolean

export function createDebugMatcher(namespaces: DEBUG): DebugMatcher {
  const pass: RegExp[] = []
  const skip: RegExp[] = []

  const patterns = namespaces.split(/[\s,]+/).filter(Boolean)
  patterns.forEach((pattern) => {
    if (pattern.startsWith('!') || pattern.startsWith('-')) {
      skip.push(compilePattern(pattern.slice(1)))
    } else {
      pass.push(compilePattern(pattern))
    }
  })

  return (namespace: string): boolean => {
    const passMatch = pass.some((pattern) => pattern.test(namespace))
    const skipMatch = skip.some((pattern) => pattern.test(namespace))
    return passMatch && !skipMatch
  }
}
