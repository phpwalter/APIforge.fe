// Import the core editor API plus only the YAML/JSON language contributions — not the full
// `monaco-editor` barrel, which registers every bundled language (Python, Rust, SQL, ...) and
// would otherwise balloon this lazy-loaded chunk by megabytes.
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import YamlWorker from 'monaco-yaml/yaml.worker.js?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import { configureMonacoYaml, type SchemasSettings } from 'monaco-yaml';
import { openapi } from '@readme/openapi-schemas';

declare global {
  interface Window {
    MonacoEnvironment?: monaco.Environment;
  }
}

let configured = false;

/**
 * Registers the Monaco/monaco-yaml/JSON web workers and the OpenAPI 3.1 schema for both the YAML
 * (via monaco-yaml) and JSON (via Monaco's built-in JSON language service) editors. Idempotent —
 * safe to call on every editor mount.
 */
export function setupMonacoOpenApiEditors(): typeof monaco {
  if (!configured) {
    self.MonacoEnvironment = {
      getWorker(_moduleId: string, label: string) {
        if (label === 'yaml') return new YamlWorker();
        if (label === 'json') return new JsonWorker();
        return new EditorWorker();
      },
    };

    // Use the schema's own $id as the registration uri so internal $refs resolve correctly.
    // Cast: the official schema is JSON Schema draft 2020-12 (uses $dynamicRef/$defs), which is
    // wider than monaco-yaml's/Monaco's own JSONSchema types — the runtime shape is what matters.
    const schemaId = (openapi.v31 as { $id: string }).$id;

    const yamlSchemas: SchemasSettings[] = [
      { uri: schemaId, fileMatch: ['*'], schema: openapi.v31 as SchemasSettings['schema'] },
    ];
    configureMonacoYaml(monaco, {
      enableSchemaRequest: false,
      hover: true,
      completion: true,
      validate: true,
      format: {},
      schemas: yamlSchemas,
    });

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      enableSchemaRequest: false,
      schemas: [{ uri: schemaId, fileMatch: ['*'], schema: openapi.v31 }],
    });

    configured = true;
  }
  return monaco;
}
