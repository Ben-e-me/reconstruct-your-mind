import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/reconstruct-your-mind/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
