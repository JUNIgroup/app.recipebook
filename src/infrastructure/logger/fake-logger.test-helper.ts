/* eslint-disable no-console */
import { Logger } from './logger'

export class FakeLogger implements Logger {
  lines: string[] = []

  output = vi.fn<[string], void>()

  constructor(public withConsoleOutput = false) {}

  log(...args: [unknown?, ...unknown[]]) {
    if (this.withConsoleOutput) console.log(...args)
    const line = `[LOG  ] ${FakeLogger.format(...args)}`
    this.lines.push(line)
    this.output(line)
  }

  error(...args: [unknown?, ...unknown[]]) {
    if (this.withConsoleOutput) console.error(...args)
    const line = `[ERROR] ${FakeLogger.format(...args)}`
    this.lines.push(line)
    this.output(line)
  }

  end() {
    const line = `[END  ] `
    this.lines.push(line)
    this.output(line)
  }

  static format(arg0: unknown, ...args: unknown[]): string {
    if (typeof arg0 !== 'string') return [arg0, ...args].join(' ')

    const values = [...args]
    const formatted = arg0.replace(/%[sdifoO]/g, (flag) => {
      if (values.length === 0) return flag
      const value = values.shift()
      switch (flag) {
        case '%d':
        case '%i':
          return parseInt(`${value}`, 10).toString()
        case '%f':
          return parseFloat(`${value}`).toString()
        case '%o':
        case '%O':
          return FakeLogger.formatObject(value)
        default:
          return `${value}`
      }
    })
    return [formatted, ...values.map(FakeLogger.formatObject)].join(' ')
  }

  static formatObject(value: unknown): string {
    if (value === null || value === undefined) return `${value}`
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'boolean') return value.toString()
    if (Array.isArray(value)) return `[${value.map(FakeLogger.formatObject).join(', ')}]`
    if (typeof value === 'object') {
      const entries = Object.entries(value)
      if (entries.length === 0) return '{}'
      return `{ ${entries.map(([key, val]) => `${key}: ${FakeLogger.formatObject(val)}`).join(', ')} }`
    }
    return `${value}`
  }
}
