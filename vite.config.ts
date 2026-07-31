/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.API_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        'vscode-languageserver-types/lib/esm/main.js': 'vscode-languageserver-types',
        'vscode-languageserver-textdocument/lib/esm/main.js': 'vscode-languageserver-textdocument',
        'buffer': path.resolve(__dirname, 'src/lib/monaco/buffer-shim.ts'),
      },
    },
    server: {
      proxy: {
        '/auth': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
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
  }
})
