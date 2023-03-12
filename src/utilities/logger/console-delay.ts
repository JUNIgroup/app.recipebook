/**
 * The implementation returns the delay as string of 6 characters since the last call.
 *
 * | example  | delay
 * | -------- | --------
 * | '      ' |    never
 * | '      ' |   <= 1ms, because the 1ms could be only the next tick of the clock
 * | '  +8ms' |   < 10ms
 * | ' +78ms' |  < 100ms
 * | '+678ms' | < 1000ms
 * | ' +6.7s' |    < 10s
 * | '+67.8s' |   < 100s
 * | ' +6.7m' |    < 10m
 * | '+67.8m' |   < 100m
 * | '«long»' |    above
 */
export interface Delay {
  /**
   * Get the time interval between two calls toString().
   *
   * @return string of 6 characters
   */
  toString(): string
}

/**
 * Creates a new instance of Delay.
 *
 * @returns a new instance of Delay
 */
export function createDelay() {
  let lastCall: number | undefined
  return {
    toString() {
      const now = Date.now()
      const delay = now - (lastCall ?? now)
      lastCall = now
      // never called or called less than 2ms ago (1ms could be only the next tick of the clock)
      if (delay < 2) return '      '

      // < 1000ms => 6 characters are enough for +999ms
      if (delay < 1000) return `  +${delay}ms`.slice(-6)

      // < 1000s => 6 characters are enough for +99.9s (rounded to 1 decimal place)
      if (delay < 99950) return ` +${(delay / 1000).toFixed(1)}s`.slice(-6)

      // < 100m => 6 characters are enough for +99.9m (rounded to 1 decimal place)
      if (delay < 5997000) return ` +${(delay / (60 * 1000)).toFixed(1)}m`.slice(-6)

      // to long for own format
      return '«long»'
    },
  }
}
