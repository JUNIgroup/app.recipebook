import { subject } from '../helpers/subject'
import { MockRdbService } from './mock-rdb.service'

// more generic tests in ../rdb.service.spec.ts

describe(MockRdbService.name, () => {
  describe('.openDB', () => {
    it('should open a database', async () => {
      const blocked = subject<string>()
      const opened = subject<string>()
      const failed = subject<string>()

      const mockRdbService = new MockRdbService()
      mockRdbService.openDB({
        onBlocked: () => blocked.resolve('onBlocked'),
        onError: () => failed.resolve('onError'),
        onOpen: () => opened.resolve('onOpen'),
      })

      await blocked
      const result = await Promise.race([opened, failed])

      expect(result).toEqual('onOpen')
    })

    it('should open a database with delay', async () => {
      const openDelay = subject<void>()
      const blocked = subject<string>()
      const opened = subject<string>()
      const failed = subject<string>()

      const mockRdbService = new MockRdbService()
      mockRdbService.openDelay = () => openDelay
      mockRdbService.openDB({
        onBlocked: () => blocked.resolve('onBlocked'),
        onError: () => failed.resolve('onError'),
        onOpen: () => opened.resolve('onOpen'),
      })

      await blocked
      openDelay.resolve()
      const result = await Promise.race([opened, failed])

      expect(result).toEqual('onOpen')
    })
  })
})
