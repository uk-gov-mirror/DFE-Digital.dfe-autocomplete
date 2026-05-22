import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'test-helpers': path.resolve(__dirname, 'test/helpers')
    }
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js']
  }
})
