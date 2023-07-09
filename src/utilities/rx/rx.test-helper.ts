import { lastValueFrom, Observable, reduce } from 'rxjs'

export function collectFrom<T>(o: Observable<T>): Promise<T[]> {
  return lastValueFrom(o.pipe(reduce((all, value) => [...all, value], [] as T[])))
}
