import { ApiError } from './client';

export type PricingAudience = string;

export interface PricingAudienceDto {
  id: string;
  label: string;
  description?: string;
  order?: number;
}

export interface PlanPriceDto {
  billingInterval?: 'free' | 'monthly' | 'annual' | 'custom' | string;
  currencyCode?: string;
  amountMinor?: number;
  displayPrice?: string;
  displayNote?: string;
  isDefault?: boolean;
}

export interface PlanFeatureDto {
  code: string;
  name: string;
  description?: string;
  included: boolean;
  value?: unknown;
  displayValue?: string;
}

export interface PlanFeatureGroupDto {
  name: string;
  features: PlanFeatureDto[];
}

export interface PlanDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  subtitle?: string;
  audience?: PricingAudience;
  order?: number;
  isFeatured?: boolean;
  requiresSalesContact?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  featureIntro?: string;
  legalNote?: string;
  prices: PlanPriceDto[];
  featureGroups: PlanFeatureGroupDto[];
}

export interface PricingCatalogResponse {
  data: PlanDto[];
  audiences?: PricingAudienceDto[];
  comparisonTitle?: string;
  comparisonSearchPlaceholder?: string;
  pricingTitle?: string;
  pricingSubtitle?: string;
  disclaimer?: string;
}

/**
 * Public pricing catalog endpoint. The UI treats the response as the authoritative source for
 * plan names, pricing, CTAs, and the feature matrix so none of that content is hard-coded in
 * React. The backend contract is intentionally frontend-ready, but the endpoint may not exist
 * until the billing domain lands on the API server.
 */
function pricingApiUrl(): string {
  const configured = import.meta.env.VITE_API_SERVER?.trim();
  const apiOrigin = configured || 'http://localhost:8080';
  return `${apiOrigin.replace(/\/+$/, '')}/plans`;
}

export async function fetchPricingCatalog(): Promise<PricingCatalogResponse> {
  const url = pricingApiUrl();

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-API-Version': 'v1',
      },
    });
  } catch (error) {
    throw new ApiError(
      `Could not reach ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!response.ok) {
    throw new ApiError(`${url} responded ${response.status} ${response.statusText}`, response.status);
  }

  try {
    return (await response.json()) as PricingCatalogResponse;
  } catch (error) {
    throw new ApiError(
      `${url} returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      response.status,
    );
  }
}
