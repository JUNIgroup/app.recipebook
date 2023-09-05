/// <reference types="vitest" />
/// <reference types="vite/client" />

import { resolve } from 'path'
import { defineConfig, splitVendorChunkPlugin } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import solidPlugin from 'vite-plugin-solid'
import solidDevTools from 'solid-devtools/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    solidDevTools({
      autoname: true,
    }),
    solidPlugin(),
    splitVendorChunkPlugin(),
    visualizer({
      title: 'Vite Bundle Tree',
      filename: 'analyze/bundle-tree.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    target: 'es2021',
  },
  resolve: {
    alias: {
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/analyze/**', '**/coverage/**', '**/dist/**', '**/fire*-debug.log'],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    testTransformMode: { web: ['.tsx?$'] },
    deps: { registerNodeLoader: true }, // otherwise, solid would be loaded twice
    setupFiles: ['jest-extended/all'],
    reporters: ['dot'],
    // reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['html'],
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/main.tsx', 'src/**/*.d.ts', 'src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    },
  },
})
