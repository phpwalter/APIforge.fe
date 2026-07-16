/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  worker: {
    // Monaco's own worker sources (editor.worker.js, monaco-yaml's yaml.worker.js) are ES
    // modules — Vite's default classic-worker output can't run them.
    format: 'es',
  },
  optimizeDeps: {
    // monaco-yaml's worker pulls in path-browserify (CJS-only) via vscode-uri — without this,
    // Vite's worker build serves it un-interopped and the worker throws "module is not defined".
    include: ['path-browserify'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
