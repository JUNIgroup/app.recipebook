export function expiresAt(time: number, expiresIn: `${number}`) {
  return time + +expiresIn * 1000
}

export function deepEqual<T extends object>(a: T | undefined | null, b: T | undefined | null) {
  if (a === b) return true
  if (!a || !b) return false
  const keysA = Object.keys(a) as (keyof T)[]
  const keysB = Object.keys(b) as (keyof T)[]
  return keysA.length === keysB.length && keysA.every((key) => a[key] === b[key])
}
