import { Log } from './api'

export type ConsolePipe = Pick<Console, 'debug' | 'info' | 'warn' | 'error'>

const drain: (message: string, ...more: unknown[]) => void = () => {}

export class ConsoleLog implements Log {
  public info: Log['info']

  public details: Log['details']

  public warn: Log['warn']

  public error: Log['error']

  private logEnabled: boolean

  constructor(public readonly namespace: string, private readonly console: ConsolePipe, enabled: boolean) {
    this.logEnabled = enabled
    this.info = enabled ? this.pipeToConsole(this.console.info) : drain
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
      this.info = enabled ? this.pipeToConsole(this.console.info) : drain
      this.details = enabled ? this.pipeToConsole(this.console.debug) : drain
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
    const template = `[%s] %s`
    return stream.bind(this.console, template, this.namespace)
  }
}
