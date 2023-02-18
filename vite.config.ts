import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

import ajv from './vite.plugin.ajv'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), //
    ajv(),
    splitVendorChunkPlugin(),
    visualizer({ filename: 'analyze/bundle-tree.html', template: 'treemap' }),
  ],
})
