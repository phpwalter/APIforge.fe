import { apiGet } from './client';

export type PricingAudience = 'individual' | 'team_enterprise' | 'api';

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
export function fetchPricingCatalog(): Promise<PricingCatalogResponse> {
  return apiGet<PricingCatalogResponse>('/plans', { apiVersion: 'v1', authenticated: false });
}
