import { describe, it, expect, vi } from 'vitest'
import { createLogger } from '@/utils/logger'

describe('createLogger', () => {
  describe('when enabled', () => {
    it('logs with prefix', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const log = createLogger(true)

      log.log('test message', 42)

      expect(spy).toHaveBeenCalledWith('[dfe-autocomplete]', 'test message', 42)
      spy.mockRestore()
    })

    it('warns with prefix', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const log = createLogger(true)

      log.warn('warning')

      expect(spy).toHaveBeenCalledWith('[dfe-autocomplete]', 'warning')
      spy.mockRestore()
    })

    it('errors with prefix', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const log = createLogger(true)

      log.error('error')

      expect(spy).toHaveBeenCalledWith('[dfe-autocomplete]', 'error')
      spy.mockRestore()
    })
  })

  describe('when disabled', () => {
    it('does not log debug traces', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const log = createLogger(false)

      log.log('should not appear')

      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })

    it('still warns (warnings are not debug-gated)', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const log = createLogger(false)

      log.warn('warning')

      expect(spy).toHaveBeenCalledWith('[dfe-autocomplete]', 'warning')
      spy.mockRestore()
    })

    it('still errors (errors are not debug-gated)', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const log = createLogger(false)

      log.error('error')

      expect(spy).toHaveBeenCalledWith('[dfe-autocomplete]', 'error')
      spy.mockRestore()
    })
  })
})
