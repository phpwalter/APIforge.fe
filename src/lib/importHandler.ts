import { useAppStore } from '../state/useAppStore';
import { useSpecStore } from '../state/useSpecStore';
import type { Endpoint, HttpMethod, ResponseEntry } from '../types/spec';
import { fetchResolvedMethodPolicy } from './api/methodPolicies';
import { parseOpenApiDocument, OpenApiImportError } from './openapiImport';

export const IMPORT_ACCEPT = '.yaml,.yml,.json,.xml,application/json,text/yaml,application/xml,text/xml';

export type ImportPolicyMode = 'preserve' | 'apply-method-policies';

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

async function applyMethodPoliciesToImportedEndpoints(endpoints: Endpoint[]): Promise<{
  endpoints: Endpoint[];
  addedResponses: number;
}> {
  const app = useAppStore.getState();
  const methods = [...new Set(endpoints.map((endpoint) => endpoint.method))];
  const context = {
    companyId: app.userProfile.companyId ?? null,
    projectId: null,
    planCode: app.userProfile.planCode ?? null,
  };

  const resolved = await Promise.all(
    methods.map(async (method) => [method, await fetchResolvedMethodPolicy(method, context)] as const),
  );
  const policies = new Map<HttpMethod, Awaited<ReturnType<typeof fetchResolvedMethodPolicy>>>(resolved);

  let addedResponses = 0;
  const reconciled = endpoints.map((endpoint) => {
    const policy = policies.get(endpoint.method);
    if (!policy) return endpoint;

    const existingCodes = new Set(endpoint.responses.map((response) => response.code.trim()));
    const governedResponses = policy.data
      .filter((item) => item.is_enabled && (item.is_required || item.is_default))
      .sort((left, right) => left.display_order - right.display_order || left.status_code - right.status_code);

    const additions: ResponseEntry[] = [];
    governedResponses.forEach((item) => {
      const code = String(item.status_code);
      if (existingCodes.has(code)) return;

      existingCodes.add(code);
      additions.push({
        id: makeId('res'),
        code,
        description: item.title || item.description || `HTTP ${code}`,
        headers: [],
        contentTypes: ['application/json'],
        schema: '',
        schemaIsArray: false,
      });
    });

    addedResponses += additions.length;
    return additions.length === 0
      ? endpoint
      : { ...endpoint, responses: [...endpoint.responses, ...additions] };
  });

  return { endpoints: reconciled, addedResponses };
}

/**
 * Shared by every "import an OpenAPI file" entry point. The imported source file is never
 * modified. `preserve` imports it as parsed; `apply-method-policies` enriches only operations
 * that already exist by adding missing enabled Required/Default response codes from the
 * resolved System/Company policy. Missing HTTP methods are deliberately not synthesized.
 */
export async function importOpenApiFile(
  file: File,
  mode: ImportPolicyMode = 'preserve',
): Promise<boolean> {
  const { setImportStatus, importSpec } = useSpecStore.getState();
  try {
    const text = await file.text();
    const parsed = parseOpenApiDocument(text, file.name);
    const reconciliation = mode === 'apply-method-policies'
      ? await applyMethodPoliciesToImportedEndpoints(parsed.endpoints)
      : { endpoints: parsed.endpoints, addedResponses: 0 };

    importSpec({ endpoints: reconciliation.endpoints, schemas: parsed.schemas });
    useAppStore.getState().setProjectInfo({
      title: parsed.title,
      version: parsed.version,
      openapiVersion: parsed.openapiVersion,
    });
    useAppStore.getState().startProjectNamed(parsed.title);

    const policySummary = mode === 'apply-method-policies'
      ? ` Added ${reconciliation.addedResponses} governed response${reconciliation.addedResponses === 1 ? '' : 's'} from APIForge Method Settings.`
      : ' Imported document preserved without applying APIForge Method Settings.';

    setImportStatus({
      type: 'success',
      message: `Imported ${parsed.title} — ${reconciliation.endpoints.length} operation${reconciliation.endpoints.length === 1 ? '' : 's'}, ${parsed.schemas.length} schema${parsed.schemas.length === 1 ? '' : 's'}.${policySummary}`,
    });
    return true;
  } catch (err) {
    const message =
      err instanceof OpenApiImportError
        ? err.message
        : `Unexpected error reading "${file.name}": ${err instanceof Error ? err.message : String(err)}`;
    setImportStatus({ type: 'error', message });
    return false;
  }
}
