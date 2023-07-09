import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), //
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
  server: {
    watch: {
      ignored: ['node_modules/', 'analyze/', 'coverage/', 'dist/', 'fire*-debug.log'],
    },
  },
})
