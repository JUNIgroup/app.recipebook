import { Log, Logger } from './api'
import { ConsoleLog, ConsolePipe } from './console-log'
import { createDebugMatcher, DEBUG, DebugMatcher } from './debug'

export type ConsoleLoggerOptions = {
  /**
   * The logger will pipe all log messages to the given function.
   *
   * @default the system console
   */
  console?: ConsolePipe
}

export interface ConsoleLogger<Namespace extends string> extends Logger<Namespace> {
  /**
   * Enable the given loggers temporary without updating the local storage key `debug`.
   *
   * @param namespaces the namespaces of the loggers to enable
   */
  enableLogs(namespaces: DEBUG): void

  /**
   * Disable the all loggers temporary without updating the local storage key `debug`.
   *
   * @param scope the scope to disable
   */
  disableAll(): void
}

type ConsoleLoggerApi<Namespace extends string> = {
  [K in keyof ConsoleLogger<Namespace>]: ConsoleLogger<Namespace>[K]
}

class ConsoleLoggerImpl<Namespace extends string> implements ConsoleLoggerApi<Namespace> {
  private console: ConsolePipe

  private logs = new Map<string, ConsoleLog>()

  private namespaces: DEBUG = ''

  private namespaceMatcher: DebugMatcher

  constructor(options: ConsoleLoggerOptions = {}) {
    this.console = options.console ?? globalThis.console
    this.namespaceMatcher = createDebugMatcher(this.namespaces)
  }

  enableLogs(namespaces: DEBUG): void {
    this.enableLogsInternal(namespaces)
  }

  disableAll(): void {
    this.enableLogsInternal('')
  }

  private enableLogsInternal(namespaces: DEBUG): void {
    if (this.namespaces !== namespaces) {
      this.namespaces = namespaces
      this.namespaceMatcher = createDebugMatcher(namespaces)
      this.logs.forEach((log, namespace) => {
        log.setEnabled(this.namespaceMatcher(namespace))
      })
    }
  }

  call(namespace: Namespace): Log {
    const log = this.logs.get(namespace)
    if (log) return log

    const enabled = this.namespaceMatcher(namespace)
    const newLog = new ConsoleLog(namespace, this.console, enabled)
    this.logs.set(namespace, newLog)
    return newLog
  }
}

export function createConsoleLogger<Namespace extends string = string>(
  options: ConsoleLoggerOptions = {},
): ConsoleLogger<Namespace> {
  const logger = new ConsoleLoggerImpl<Namespace>(options)
  return Object.assign((namespace: Namespace) => logger.call(namespace), {
    enableLogs: logger.enableLogs.bind(logger),
    disableAll: logger.disableAll.bind(logger),
  })
}
