import { Log, Logger } from './api'

export type FakeLogOptions = {
  console?: boolean | Console['log']
}

export type FakeLogEntry = {
  level: 'info' | 'details' | 'warn' | 'error'
  message: string
  more: unknown[]
}

export class FakeLog implements Log {
  readonly enabled = true

  private readonly allEntries: FakeLogEntry[] = []

  private readonly pipe: false | Console['log']

  constructor(
    public readonly namespace: string,
    options: FakeLogOptions = {},
  ) {
    // eslint-disable-next-line no-console
    this.pipe = options.console === true ? console.log : options.console ?? false
  }

  /**
   * @returns all logged entries.
   */
  get entries(): FakeLogEntry[] {
    return this.allEntries
  }

  /**
   * Filter the logged entries by level.
   *
   * @param level the level to filter for
   * @returns all logged entries with the given level.
   */
  entriesOf(level: 'info' | 'details' | 'warn' | 'error'): FakeLogEntry[] {
    return this.allEntries.filter((entry) => entry.level === level)
  }

  /**
   * @returns all logged messages but not the additional data.
   */
  get messages(): string[] {
    return this.allEntries.map((entry) => entry.message)
  }

  /**
   * @returns all logged messages and the additional data as formatted lines
   */
  get lines(): string[] {
    return this.allEntries.map((entry) => this.formatEntry(entry))
  }

  info(message: string, ...more: unknown[]): void {
    this.addEntry('info', message, more)
  }

  details(message: string, ...more: unknown[]): void {
    this.addEntry('details', message, more)
  }

  warn(message: string, ...more: unknown[]): void {
    this.addEntry('warn', message, more)
  }

  error(message: string, ...more: unknown[]): void {
    this.addEntry('error', message, more)
  }

  private addEntry(level: 'info' | 'details' | 'warn' | 'error', message: string, more: unknown[]): void {
    const entry = { level, message, more }
    if (this.pipe) {
      this.pipe(this.formatEntry(entry))
    }
    this.allEntries.push(entry)
  }

  private formatEntry(entry: FakeLogEntry): string {
    const parts = [entry.message, ...entry.more.map((m) => FakeLog.formatValue(m))]
    return `[${entry.level.padEnd(7, '.')}|${this.namespace}] ${parts.join(' ')}`
  }

  private static formatValue(value: unknown): string {
    if (value === undefined) return '«undefined»'
    if (value === null) return '«null»'
    if (value === '') return '«empty string»'
    if (typeof value === 'string') return value

    const simple = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/

    function stringify(v: unknown): string {
      if (v === undefined) return 'undefined'
      if (v === null) return 'null'
      if (typeof v !== 'object') return JSON.stringify(v)
      if (Array.isArray(v)) return `[ ${v.map((i) => stringify(i)).join(', ')} ]`
      const entries = Object.entries(v)
      if (entries.length === 0) return '{}'
      return `{ ${entries
        .map(([key, val]) => `${key.match(simple) ? key : JSON.stringify(key)}: ${stringify(val)}`)
        .join(', ')} }`
    }
    return stringify(value)
  }
}

export interface FakeLogger extends Logger {
  (namespace: string): FakeLog
}

export function createFakeLogger(options: FakeLogOptions = { console: false }): FakeLogger {
  const logs = new Map<string, FakeLog>()

  return (namespace: string): FakeLog => {
    let log = logs.get(namespace)
    if (!log) {
      log = new FakeLog(namespace, options)
      logs.set(namespace, log)
    }
    return log
  }
}
