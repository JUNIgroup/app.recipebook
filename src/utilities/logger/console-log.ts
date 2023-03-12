import { Log } from './api'
import { getHashColor, styleConsoleLog, middleGray } from './console-colors'
import { isChrome } from './browser-detect'
import { createDelay, Delay } from './console-delay'

export type ConsolePipe = Pick<Console, 'debug' | 'log' | 'warn' | 'error'>

const drain: (message: string, ...more: unknown[]) => void = () => {}

export class ConsoleLog implements Log {
  public info: Log['info']

  public details: Log['details']

  public warn: Log['warn']

  public error: Log['error']

  private logEnabled: boolean

  private readonly color: string

  private readonly delay: Delay

  constructor(public readonly namespace: string, private readonly console: ConsolePipe, enabled: boolean) {
    this.logEnabled = enabled
    this.color = getHashColor(namespace)
    this.delay = createDelay()
    this.info = enabled ? this.pipeToConsole(this.console.log) : drain
    this.details = enabled ? this.pipeToConsole(this.console.debug) : drain
    this.warn = this.pipeToConsole(this.console.warn)
    this.error = this.pipeToConsole(this.console.error)
  }

  get enabled(): boolean {
    return this.logEnabled
  }

  setEnabled(enabled: boolean) {
    if (this.logEnabled !== enabled) {
      this.logEnabled = enabled
      if (enabled) {
        this.info = this.pipeToConsole(this.console.log)
        this.details = this.pipeToConsole(this.console.debug)
      } else {
        this.info = drain
        this.details = drain
      }
    }
  }

  /**
   * Use `bind` to ensure that console.* shows the correct caller.
   *
   * Thanks to Stijn de Witt for the idea, used in ulog.
   * @see https://github.com/Download Stijn de Witt
   * @see https://github.com/Download/ulog#preserves-callstack ulog
   */
  private pipeToConsole(stream: Console['info']): (message: string, ...more: unknown[]) => void {
    const args = styleConsoleLog({
      namespace: this.namespace,
      namespaceColor: this.color,
      hint: this.delay,
      hintColor: middleGray,
      chrome: isChrome,
    })
    return stream.bind(this.console, ...args) as (message: string, ...more: unknown[]) => void
  }
}
