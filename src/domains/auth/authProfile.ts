import { authenticatedApiRequest } from "./authenticatedApi";

export type AuthenticatedProfile = {
  id?: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  companyId?: string;
  companyName?: string;
  roles: string[];
  raw: Record<string, unknown>;
};

type UnknownRecord = Record<string, unknown>;

export async function fetchAuthenticatedProfile(signal?: AbortSignal): Promise<AuthenticatedProfile> {
  const payload = await authenticatedApiRequest<unknown>("/auth/me", {
    method: "POST",
    signal,
    requireBody: true,
  });

  return normalizeAuthenticatedProfile(payload);
}

export function normalizeAuthenticatedProfile(payload: unknown): AuthenticatedProfile {
  const root = asRecord(payload);
  const data = asRecord(root.data) ?? root;
  const user = asRecord(data.user) ?? data;
  const company = asRecord(data.company) ?? asRecord(user.company);

  const email = firstString(user.email, data.email);
  const displayName =
    firstString(
      user.display_name,
      user.displayName,
      user.name,
      data.display_name,
      data.displayName,
      data.name,
      email,
    ) ?? "User";

  const roles = normalizeRoles(data.roles ?? user.roles ?? data.role ?? user.role);

  return {
    id: firstString(user.id, user.user_id, data.id, data.user_id),
    email,
    displayName,
    avatarUrl: firstString(user.avatar_url, user.avatarUrl, user.picture, data.avatar_url, data.avatarUrl),
    companyId: firstString(company?.id, company?.company_id, user.company_id, data.company_id),
    companyName: firstString(company?.name, company?.display_name, data.company_name, user.company_name),
    roles,
    raw: data,
  };
}

function normalizeRoles(value: unknown): string[] {
  if (typeof value === "string" && value.trim() !== "") return [value];
  if (!Array.isArray(value)) return [];

  const roles: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.trim() !== "") {
      roles.push(item);
      continue;
    }

    const record = asRecord(item);
    const code = firstString(record?.role_code, record?.code, record?.name);
    if (code) roles.push(code);
  }

  return Array.from(new Set(roles));
}

function asRecord(value: unknown): UnknownRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return undefined;
}
