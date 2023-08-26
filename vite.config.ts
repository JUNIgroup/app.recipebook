import { resolve } from 'path'
import { defineConfig, splitVendorChunkPlugin } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import solidPlugin from 'vite-plugin-solid'
import solidDevTools from 'solid-devtools/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    solidDevTools({
      /* features options - all disabled by default */
      autoname: true, // e.g. enable autoname
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
      ignored: ['node_modules/', 'analyze/', 'coverage/', 'dist/', 'fire*-debug.log'],
    },
  },
})
