import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

import ajv from './vite.plugin.ajv'

export default defineConfig({
  plugins: [react(), ajv()],
  test: {
    globals: true,
    reporters: ['verbose'],
    setupFiles: ['jest-extended/all'],
    coverage: {
      all: true,
      reporter: ['text', 'html', 'lcov'],
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/main.tsx', 'src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
  },
})
