// Import the core editor API plus only the YAML basic-language contribution — not the full
// `monaco-editor` barrel, which registers every bundled language (Python, Rust, SQL, ...) and
// would otherwise balloon this lazy-loaded chunk by megabytes for a YAML-only editor.
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import YamlWorker from 'monaco-yaml/yaml.worker.js?worker';
import { configureMonacoYaml, type SchemasSettings } from 'monaco-yaml';
import { openapi } from '@readme/openapi-schemas';

declare global {
  interface Window {
    MonacoEnvironment?: monaco.Environment;
  }
}

let configured = false;

/** Registers the Monaco/monaco-yaml web workers and the OpenAPI 3.1 schema. Idempotent — safe to call on every editor mount. */
export function setupMonacoOpenApiYaml(): typeof monaco {
  if (!configured) {
    self.MonacoEnvironment = {
      getWorker(_moduleId: string, label: string) {
        if (label === 'yaml') return new YamlWorker();
        return new EditorWorker();
      },
    };

    // Use the schema's own $id as the registration uri so internal $refs resolve correctly.
    // Cast: the official schema is JSON Schema draft 2020-12 (uses $dynamicRef/$defs), which is
    // wider than monaco-yaml's own JSONSchema type — the runtime shape is what matters here.
    const schemas: SchemasSettings[] = [
      {
        uri: (openapi.v31 as { $id: string }).$id,
        fileMatch: ['*'],
        schema: openapi.v31 as SchemasSettings['schema'],
      },
    ];
    configureMonacoYaml(monaco, {
      enableSchemaRequest: false,
      hover: true,
      completion: true,
      validate: true,
      format: {},
      schemas,
    });

    configured = true;
  }
  return monaco;
}
