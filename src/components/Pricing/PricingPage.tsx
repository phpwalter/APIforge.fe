import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  CircleOff,
  LoaderCircle,
  Network,
  Rocket,
  Search,
  Sparkles,
  Store,
  Building2,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { AuthModal } from '../Auth/AuthModal';
import {
  fetchPricingCatalog,
  type PlanDto,
  type PlanFeatureDto,
  type PlanPriceDto,
  type PricingAudience,
  type PricingCatalogResponse,
} from '../../lib/api/pricing';
import { ApiError } from '../../lib/api/client';
import styles from './PricingPage.module.css';

const AUDIENCE_META: { id: PricingAudience; label: string }[] = [
  { id: 'individual', label: 'Individual' },
  { id: 'team_enterprise', label: 'Team & Enterprise' },
  { id: 'api', label: 'API' },
];

const DEFAULT_PRICING_TITLE = 'Pricing';
const DEFAULT_COMPARISON_TITLE = 'Compare features across plans';
const DEFAULT_SEARCH_PLACEHOLDER = 'Search';

interface PriceDisplay {
  label: string;
  note: string | null;
}

interface ComparisonRow {
  id: string;
  label: string;
  description?: string;
  groupName: string;
  valuesByPlanId: Map<string, PlanFeatureDto>;
}

function getAudience(plan: PlanDto): PricingAudience {
  return plan.audience ?? 'individual';
}

function comparePlans(a: PlanDto, b: PlanDto): number {
  const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) return orderA - orderB;
  return a.name.localeCompare(b.name);
}

function choosePrice(prices: PlanPriceDto[]): PlanPriceDto | null {
  if (prices.length === 0) return null;
  return (
    prices.find((price) => price.isDefault) ??
    prices.find((price) => price.billingInterval === 'monthly') ??
    prices.find((price) => price.billingInterval === 'annual') ??
    prices[0]
  );
}

function formatCurrency(currencyCode: string, amountMinor: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

function priceDisplay(plan: PlanDto): PriceDisplay {
  const price = choosePrice(plan.prices);

  if (!price) {
    return {
      label: plan.requiresSalesContact ? 'Contact sales' : 'Included',
      note: null,
    };
  }

  if (price.displayPrice) {
    return { label: price.displayPrice, note: price.displayNote ?? null };
  }

  if ((price.billingInterval === 'free' || price.amountMinor === 0) && price.currencyCode) {
    return { label: formatCurrency(price.currencyCode, 0), note: price.displayNote ?? 'Free forever' };
  }

  if (typeof price.amountMinor === 'number' && price.currencyCode) {
    const label = formatCurrency(price.currencyCode, price.amountMinor);
    const note =
      price.displayNote ??
      (price.billingInterval === 'annual'
        ? 'Per year'
        : price.billingInterval === 'monthly'
          ? 'Per month'
          : null);

    return { label, note };
  }

  return { label: 'Available on request', note: price.displayNote ?? null };
}

function iconForPlan(code: string, audience: PricingAudience) {
  const normalized = code.toLowerCase();

  if (normalized.includes('enterprise')) return Building2;
  if (normalized.includes('team')) return Store;
  if (normalized.includes('max')) return Zap;
  if (normalized.includes('pro')) return Rocket;
  if (normalized.includes('api')) return Network;
  if (audience === 'team_enterprise') return Store;
  if (audience === 'api') return Network;
  return Sparkles;
}

function buildComparisonRows(plans: PlanDto[]): ComparisonRow[] {
  const rows = new Map<string, ComparisonRow>();

  plans.forEach((plan) => {
    plan.featureGroups.forEach((group) => {
      group.features.forEach((feature) => {
        const key = feature.code || `${group.name}:${feature.name}`;
        const existing = rows.get(key);
        if (existing) {
          existing.valuesByPlanId.set(plan.id, feature);
          return;
        }

        rows.set(key, {
          id: key,
          label: feature.name,
          description: feature.description,
          groupName: group.name,
          valuesByPlanId: new Map([[plan.id, feature]]),
        });
      });
    });
  });

  return [...rows.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function featureValueLabel(feature?: PlanFeatureDto): string | null {
  if (!feature) return null;
  if (feature.displayValue) return feature.displayValue;
  if (typeof feature.value === 'string' && feature.value.trim()) return feature.value;
  if (typeof feature.value === 'number') return String(feature.value);
  if (typeof feature.value === 'boolean') return feature.value ? 'Included' : 'Not included';
  return null;
}

function ctaLabelForPlan(plan: PlanDto): string {
  return plan.ctaLabel ?? (plan.requiresSalesContact ? 'Contact sales' : 'Get started');
}

function secondaryCtaLabelForPlan(plan: PlanDto): string | null {
  return plan.secondaryCtaLabel ?? null;
}

function subtitleForPlan(plan: PlanDto): string | null {
  return plan.subtitle ?? plan.description ?? null;
}

function footerDisclaimer(catalog: PricingCatalogResponse, plans: PlanDto[]): string | null {
  if (catalog.disclaimer) return catalog.disclaimer;
  return plans.map((plan) => plan.legalNote).find((note): note is string => Boolean(note)) ?? null;
}

export function PricingPage() {
  const theme = useAppStore((s) => s.theme);
  const openAuth = useAppStore((s) => s.openAuth);
  const authOpen = useAppStore((s) => s.authOpen);
  const [catalog, setCatalog] = useState<PricingCatalogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAudience, setActiveAudience] = useState<PricingAudience>('individual');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchPricingCatalog()
      .then((response) => {
        if (cancelled) return;
        setCatalog(response);

        const availableAudience = AUDIENCE_META.find(({ id }) => response.data.some((plan) => getAudience(plan) === id));
        if (availableAudience) setActiveAudience(availableAudience.id);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) setError(err.message);
        else setError('Pricing could not be loaded right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const plansByAudience = useMemo(() => {
    const grouped = new Map<PricingAudience, PlanDto[]>();
    AUDIENCE_META.forEach(({ id }) => grouped.set(id, []));

    (catalog?.data ?? []).forEach((plan) => {
      const audience = getAudience(plan);
      const list = grouped.get(audience);
      if (list) list.push(plan);
      else grouped.set(audience, [plan]);
    });

    grouped.forEach((plans) => plans.sort(comparePlans));
    return grouped;
  }, [catalog]);

  const availableAudiences = useMemo(
    () => AUDIENCE_META.filter(({ id }) => (plansByAudience.get(id)?.length ?? 0) > 0),
    [plansByAudience],
  );

  const activePlans = plansByAudience.get(activeAudience) ?? [];
  const comparisonRows = useMemo(() => buildComparisonRows(activePlans), [activePlans]);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return comparisonRows;

    return comparisonRows.filter((row) => {
      const haystack = `${row.groupName} ${row.label} ${row.description ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [comparisonRows, search]);

  const groupedRows = useMemo(() => {
    const groups = new Map<string, ComparisonRow[]>();
    filteredRows.forEach((row) => {
      const list = groups.get(row.groupName) ?? [];
      list.push(row);
      groups.set(row.groupName, list);
    });

    return [...groups.entries()].map(([groupName, rows]) => ({ groupName, rows }));
  }, [filteredRows]);

  const title = catalog?.pricingTitle ?? DEFAULT_PRICING_TITLE;
  const subtitle = catalog?.pricingSubtitle ?? null;
  const comparisonTitle = catalog?.comparisonTitle ?? DEFAULT_COMPARISON_TITLE;
  const disclaimer = catalog ? footerDisclaimer(catalog, activePlans) : null;

  return (
    <div className="app" data-theme={theme} style={{ position: 'absolute', inset: 0 }}>
      <div className={styles.page}>
        <div className={styles.topBar} />

        <header className={styles.header}>
          <button type="button" className={styles.backButton} onClick={() => window.location.assign('/')}>
            <ChevronLeft size={16} />
            Back
          </button>
          <div className={styles.headerSpacer} />
          <button type="button" className={styles.signInButton} onClick={openAuth}>
            Sign In
          </button>
        </header>

        <main className={styles.main}>
          <section className={styles.hero}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </section>

          {loading ? (
            <div className={styles.stateCard} role="status" aria-live="polite">
              <LoaderCircle size={20} className={styles.spinner} />
              <span>Loading pricing…</span>
            </div>
          ) : error ? (
            <div className={styles.stateCard} role="alert">
              <div className={styles.stateTitle}>Pricing is unavailable</div>
              <p className={styles.stateText}>{error}</p>
            </div>
          ) : availableAudiences.length === 0 ? (
            <div className={styles.stateCard} role="status">
              <div className={styles.stateTitle}>No plans are currently published</div>
              <p className={styles.stateText}>Publish at least one active public plan to populate this page.</p>
            </div>
          ) : (
            <>
              <div className={styles.segmentedControl} role="tablist" aria-label="Pricing audiences">
                {availableAudiences.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={activeAudience === id}
                    className={`${styles.segmentButton} ${activeAudience === id ? styles.segmentButtonActive : ''}`}
                    onClick={() => {
                      setActiveAudience(id);
                      setSearch('');
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <section className={styles.cardsGrid} aria-label={`${activeAudience} pricing plans`}>
                {activePlans.map((plan) => {
                  const Icon = iconForPlan(plan.code, getAudience(plan));
                  const price = priceDisplay(plan);
                  const secondaryCta = secondaryCtaLabelForPlan(plan);
                  return (
                    <article
                      key={plan.id}
                      className={`${styles.planCard} ${plan.isFeatured ? styles.planCardFeatured : ''}`}
                    >
                      <div className={styles.planIconWrap}>
                        <Icon size={28} />
                      </div>

                      <div className={styles.planHeader}>
                        <h2 className={styles.planTitle}>{plan.name}</h2>
                        {subtitleForPlan(plan) && <p className={styles.planSubtitle}>{subtitleForPlan(plan)}</p>}
                      </div>

                      <div className={styles.priceBlock}>
                        <div className={styles.priceLabel}>{price.label}</div>
                        {price.note && <div className={styles.priceNote}>{price.note}</div>}
                      </div>

                      <div className={styles.ctaStack}>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={() => {
                            if (plan.ctaHref) {
                              window.location.assign(plan.ctaHref);
                              return;
                            }
                            openAuth();
                          }}
                        >
                          {ctaLabelForPlan(plan)}
                        </button>
                        {secondaryCta && (
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => {
                              if (plan.secondaryCtaHref) window.location.assign(plan.secondaryCtaHref);
                              else openAuth();
                            }}
                          >
                            {secondaryCta}
                          </button>
                        )}
                      </div>

                      <div className={styles.cardDivider} />

                      {plan.featureIntro && <p className={styles.featureIntro}>{plan.featureIntro}</p>}
                      <ul className={styles.featureList}>
                        {plan.featureGroups.flatMap((group) =>
                          group.features
                            .filter((feature) => feature.included)
                            .map((feature) => (
                              <li key={`${group.name}-${feature.code}`} className={styles.featureItem}>
                                <Check size={15} />
                                <span>{feature.displayValue ?? feature.name}</span>
                              </li>
                            )),
                        )}
                      </ul>
                    </article>
                  );
                })}
              </section>

              {disclaimer && <p className={styles.disclaimer}>{disclaimer}</p>}

              {comparisonRows.length > 0 && (
                <section className={styles.comparisonSection}>
                  <div className={styles.comparisonHero}>
                    <div className={styles.comparisonIconWrap}>
                      <Search size={28} />
                    </div>
                    <h2 className={styles.comparisonTitle}>{comparisonTitle}</h2>
                  </div>

                  <div className={styles.comparisonControls}>
                    <label className={styles.searchBox}>
                      <Search size={16} />
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={catalog?.comparisonSearchPlaceholder ?? DEFAULT_SEARCH_PLACEHOLDER}
                        aria-label="Search features"
                      />
                    </label>
                  </div>

                  <div className={styles.tableScroller}>
                    <table className={styles.compareTable}>
                      <thead>
                        <tr>
                          <th className={styles.featureColumnHead}>Features</th>
                          {activePlans.map((plan) => (
                            <th key={plan.id} className={styles.planColumnHead}>
                              <div className={styles.comparePlanName}>{plan.name}</div>
                              <button
                                type="button"
                                className={styles.comparePlanButton}
                                onClick={() => {
                                  if (plan.ctaHref) {
                                    window.location.assign(plan.ctaHref);
                                    return;
                                  }
                                  openAuth();
                                }}
                              >
                                {ctaLabelForPlan(plan)}
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      {groupedRows.map(({ groupName, rows }) => (
                        <tbody key={groupName}>
                          <tr className={styles.groupRow}>
                            <th colSpan={activePlans.length + 1}>{groupName}</th>
                          </tr>
                          {rows.map((row) => (
                            <tr key={row.id}>
                              <td className={styles.featureCell}>
                                <div className={styles.featureName}>{row.label}</div>
                                {row.description && <div className={styles.featureDescription}>{row.description}</div>}
                              </td>
                              {activePlans.map((plan) => {
                                const value = row.valuesByPlanId.get(plan.id);
                                const displayValue = featureValueLabel(value);
                                return (
                                  <td key={`${row.id}-${plan.id}`} className={styles.valueCell}>
                                    {displayValue && displayValue !== 'Included' && displayValue !== 'Not included' ? (
                                      <span className={styles.valueText}>{displayValue}</span>
                                    ) : value?.included ? (
                                      <span className={styles.iconIncluded} aria-label="Included">
                                        <Check size={15} />
                                      </span>
                                    ) : (
                                      <span className={styles.iconExcluded} aria-label="Not included">
                                        <CircleOff size={15} />
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      ))}
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
      {authOpen && <AuthModal />}
    </div>
  );
}
