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

  /**
   * Initial namespaces to enable.
   *
   * @default '*' if development mode, '' otherwise
   */
  enableLogs?: DEBUG
}

export interface ConsoleLogger<Scope extends string> extends Logger<Scope> {
  /**
   * Enable the given loggers temporary without updating the local storage key `debug`.
   *
   * If the given namespace is null, the default settings for enabling loggers will be used.
   *
   * @param namespaces the namespaces of the loggers to enable
   */
  enableLogs(namespaces: DEBUG | null): void

  /**
   * Disable the all loggers temporary without updating the local storage key `debug`.
   *
   * @param scope the scope to disable
   */
  disableAll(): void
}

type ConsoleLoggerApi<Scope extends string> = {
  [K in keyof ConsoleLogger<Scope>]: ConsoleLogger<Scope>[K]
}

class ConsoleLoggerImpl<Scope extends string> implements ConsoleLoggerApi<Scope> {
  private console: ConsolePipe

  private logs = new Map<string, ConsoleLog>()

  private defaultNamespaces: DEBUG

  private namespaces: DEBUG

  private namespaceMatcher: DebugMatcher

  constructor(options: ConsoleLoggerOptions = {}) {
    this.console = options.console ?? globalThis.console
    this.defaultNamespaces = options.enableLogs ?? (process.env.NODE_ENV === 'development' ? '*' : '')
    this.namespaces = this.defaultNamespaces
    this.namespaceMatcher = createDebugMatcher(this.namespaces)
  }

  enableLogs(namespaces: DEBUG): void {
    this.enableLogsInternal(namespaces ?? this.defaultNamespaces)
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

  call(namespace: `${Scope}:${string}`): Log {
    const log = this.logs.get(namespace)
    if (log) return log

    const enabled = this.namespaceMatcher(namespace)
    const newLog = new ConsoleLog(namespace, this.console, enabled)
    this.logs.set(namespace, newLog)
    return newLog
  }
}

export function createConsoleLogger<Scope extends string = string>(
  options: ConsoleLoggerOptions = {},
): ConsoleLogger<Scope> {
  const logger = new ConsoleLoggerImpl<Scope>(options)
  return Object.assign((namespace: `${Scope}:${string}`) => logger.call(namespace), {
    enableLogs: logger.enableLogs.bind(logger),
    disableAll: logger.disableAll.bind(logger),
  })
}
