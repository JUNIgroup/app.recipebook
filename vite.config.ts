import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), //
    splitVendorChunkPlugin(),
    visualizer({ filename: 'analyze/bundle-tree.html', template: 'treemap' }),
  ],
})
