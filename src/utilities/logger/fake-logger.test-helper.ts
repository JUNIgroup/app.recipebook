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

  constructor(public readonly namespace: string, options: FakeLogOptions = {}) {
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
    const parts = [entry.message, ...entry.more.map((m) => JSON.stringify(m))]
    return `[${entry.level}|${this.namespace}] ${parts.join(' ')}`
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
