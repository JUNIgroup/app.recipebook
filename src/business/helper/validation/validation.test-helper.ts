export type Change = {
  path: string
  values: unknown[]
}

export const DELETE = Symbol('DELETE')

export const NON_STRING_SAMPLES = [42, true, {}, []]
export const NON_OBJECT_SAMPLES = [42, true, '', 'a-string', []]

export class ChangeDesc {
  static fromChanges(changes: Change[]) {
    return changes.flatMap(ChangeDesc.fromChange)
  }

  static fromChange(change: Change): ChangeDesc[] {
    const { path, values } = change
    return values.map((value) => new ChangeDesc(path, value))
  }

  constructor(public path: string, public value: unknown) {}

  get isDeleting() {
    return this.value === DELETE
  }

  apply(data: unknown): unknown {
    const copy = JSON.parse(JSON.stringify(data))
    expect(copy).toEqual(data)

    const pathArray = this.path.split('.')
    const lastIndex = pathArray.length - 1
    let current = copy
    pathArray.forEach((segment, index) => {
      if (index === lastIndex) {
        if (this.isDeleting) delete current[segment]
        else current[segment] = this.value
        return
      }

      if (!current[segment]) {
        current[segment] = {}
      }

      current = current[segment]
    })

    return copy
  }

  toString() {
    if (this.isDeleting) return `delete ${this.path}`
    return `set ${this.path}:=${JSON.stringify(this.value)}`
  }
}

export function minimalOf(data: unknown, changes: Change[]) {
  return ChangeDesc.fromChanges(changes)
    .filter((change) => change.isDeleting)
    .sort((a, b) => b.path.length - a.path.length)
    .reduce((d, change) => change.apply(d), data)
}
