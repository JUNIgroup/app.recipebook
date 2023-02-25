import { merge, Subject } from 'rxjs'
import { collectFrom } from '../helpers/collect-from'
import { MockRdbService } from './mock-rdb.service'

// more generic tests in ../rdb.service.spec.ts

describe(MockRdbService.name, () => {
  describe('.openDB', () => {
    it('should open a database', async () => {
      const mockRdbService = new MockRdbService()
      const states = collectFrom(mockRdbService.openDB())

      expect(states).resolves.toEqual(['open'])
    })

    it('should open a database with delay', async () => {
      const delay = new Subject<string>()

      const mockRdbService = new MockRdbService()
      mockRdbService.openDelay = () => delay

      const states = collectFrom(merge(mockRdbService.openDB(), delay))
      delay.next('delay')
      delay.complete()

      expect(states).resolves.toEqual(['delay', 'blocked', 'open'])
    })
  })
})
