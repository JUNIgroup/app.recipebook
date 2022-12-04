/* eslint-disable no-console */

export type Logger = {
  log: Console['log']
  error: Console['error']
  end: () => void
}

export function ServiceLogger(serviceName: string) {
  return function createLogger(groupName: string, hint?: string | undefined | null): Logger {
    console.groupCollapsed(`[${serviceName}] ${groupName}${hint ? `: ${hint}` : ''}`)
    let succeed = true
    const timer = Date.now()
    return {
      log: console.log,
      error: (...args: unknown[]) => {
        succeed = false
        console.error(...args)
      },
      end: () => {
        console.groupEnd()
        const duration = Date.now() - timer
        if (succeed) console.log(`[${serviceName}] ${groupName}: ✔️ ${duration}ms`)
        else console.log(`[${serviceName}] ${groupName}: ❌ ${duration}ms`)
      },
    }
  }
}
