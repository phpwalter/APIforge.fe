/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiServer = env.VITE_API_SERVER;

  if (!apiServer && mode !== 'test') {
    throw new Error('VITE_API_SERVER is required. Copy .env.example to .env.local and configure it.');
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        'vscode-languageserver-types/lib/esm/main.js': 'vscode-languageserver-types',
        'vscode-languageserver-textdocument/lib/esm/main.js': 'vscode-languageserver-textdocument',
        buffer: path.resolve(__dirname, 'src/lib/monaco/buffer-shim.ts'),
      },
    },
    worker: { format: 'es' },
    optimizeDeps: { include: ['path-browserify'] },
    build: {
      rollupOptions: {
        output: {
          manualChunks(moduleId) {
            const id = moduleId.replaceAll('\\', '/');

            if (id.includes('/node_modules/@readme/openapi-schemas/')) {
              return 'openapi-schemas';
            }

            if (
              id.includes('/node_modules/monaco-yaml/') ||
              id.includes('/node_modules/yaml-language-server/') ||
              id.includes('/node_modules/vscode-languageclient/') ||
              id.includes('/node_modules/vscode-languageserver') ||
              id.includes('/node_modules/vscode-uri/') ||
              id.includes('/node_modules/path-browserify/')
            ) {
              return 'monaco-yaml';
            }

            if (id.includes('/node_modules/monaco-editor/')) {
              return 'monaco-editor';
            }

            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/scheduler/') ||
              id.includes('/node_modules/zustand/')
            ) {
              return 'react-vendor';
            }

            if (
              id.includes('/node_modules/highlight.js/') ||
              id.includes('/node_modules/js-yaml/') ||
              id.includes('/node_modules/crypto-js/')
            ) {
              return 'document-utils';
            }
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary'],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  };
});
