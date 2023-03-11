import { ConsolePipe } from './console-log'

function extractStack(): string[] {
  // skip first three lines of the stack trace:
  // 1. the constructor of the Error
  // 2. the call to extractStack
  // 3. the call to the console method
  const stack = (new Error().stack ?? '').split('\n').slice(3)
  return stack.map((line) => line.replace(/\s+at\s+/, ''))
}

/**
 * A fake console that can be used to test the logger.
 */
export class FakeConsole implements ConsolePipe {
  stack: string[] = ['not set']

  innerInfo = vi.fn()

  innerDebug = vi.fn()

  innerWarn = vi.fn()

  innerError = vi.fn()

  info(...args: unknown[]) {
    assert(this, 'this in not bound to the call of info')
    this.stack = extractStack()
    this.innerInfo(...args)
  }

  debug(...args: unknown[]) {
    assert(this, 'this in not bound to the call of debug')
    this.stack = extractStack()
    this.innerDebug(...args)
  }

  warn(...args: unknown[]) {
    assert(this, 'this in not bound to the call of warn')
    this.stack = extractStack()
    this.innerWarn(...args)
  }

  error(...args: unknown[]) {
    assert(this, 'this in not bound to the call of error')
    this.stack = extractStack()
    this.innerError(...args)
  }
}
