import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PricingPage } from './PricingPage';
import { useAppStore } from '../../state/useAppStore';
import type { PricingCatalogResponse } from '../../lib/api/pricing';

const fetchPricingCatalog = vi.fn<() => Promise<PricingCatalogResponse>>();

vi.mock('../../lib/api/pricing', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api/pricing')>('../../lib/api/pricing');
  return {
    ...actual,
    fetchPricingCatalog,
  };
});

vi.mock('../Auth/AuthModal', () => ({
  AuthModal: () => <div data-testid="auth-modal" />,
}));

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
  fetchPricingCatalog.mockReset();
});

const catalog: PricingCatalogResponse = {
  pricingTitle: 'Pricing',
  comparisonTitle: 'Compare features across plans',
  comparisonSearchPlaceholder: 'Search',
  disclaimer: 'Usage limits apply. Prices shown do not include applicable tax.',
  audiences: [
    { id: 'personal', label: 'Personal', order: 10 },
    { id: 'business', label: 'Business', order: 20 },
  ],
  data: [
    {
      id: 'free',
      code: 'free',
      name: 'Free',
      audience: 'personal',
      subtitle: 'Try APIforge',
      ctaLabel: 'Try APIforge',
      prices: [{ billingInterval: 'free', currencyCode: 'USD', amountMinor: 0 }],
      featureGroups: [
        {
          name: 'Features and capabilities',
          features: [
            { code: 'chat', name: 'Chat on web', included: true },
            { code: 'git-sync', name: 'Git sync', included: false },
          ],
        },
      ],
    },
    {
      id: 'pro',
      code: 'pro',
      name: 'Pro',
      audience: 'personal',
      subtitle: 'For everyday productivity',
      ctaLabel: 'Try APIforge',
      featureIntro: 'Everything in Free, plus:',
      prices: [{ billingInterval: 'monthly', currencyCode: 'USD', amountMinor: 1700, displayNote: 'Per month' }],
      featureGroups: [
        {
          name: 'Features and capabilities',
          features: [
            { code: 'chat', name: 'Chat on web', included: true },
            { code: 'git-sync', name: 'Git sync', included: true },
          ],
        },
      ],
    },
    {
      id: 'team',
      code: 'team',
      name: 'Team',
      audience: 'business',
      subtitle: 'For teams of 2 to 150',
      ctaLabel: 'Get Team plan',
      prices: [{ displayPrice: '$20', displayNote: 'Per seat / month if billed annually.' }],
      featureGroups: [
        {
          name: 'Admin',
          features: [{ code: 'sso', name: 'Single sign-on', included: true }],
        },
      ],
    },
  ],
};

describe('PricingPage', () => {
  it('renders the pricing cards and comparison matrix from API data', async () => {
    fetchPricingCatalog.mockResolvedValue(catalog);

    render(<PricingPage />);

    expect(screen.getByText('Loading pricing…')).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'Pricing' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Personal' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Free' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument();
    expect(screen.getByText('Everything in Free, plus:')).toBeInTheDocument();
    expect(screen.getByText('Compare features across plans')).toBeInTheDocument();
    expect(screen.getByText('Usage limits apply. Prices shown do not include applicable tax.')).toBeInTheDocument();
  });

  it('switches segments and filters comparison rows', async () => {
    const user = userEvent.setup();
    fetchPricingCatalog.mockResolvedValue(catalog);

    render(<PricingPage />);

    expect(await screen.findByRole('heading', { name: 'Pricing' })).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Search features' }), 'git');
    expect(screen.getByText('Git sync')).toBeInTheDocument();
    expect(screen.queryByText('Chat on web')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Business' }));

    expect(screen.getByRole('heading', { name: 'Team' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Free' })).not.toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('Single sign-on')).toBeInTheDocument();
  });

  it('opens the auth modal when a plan CTA is clicked without a dedicated link', async () => {
    const user = userEvent.setup();
    fetchPricingCatalog.mockResolvedValue(catalog);

    render(<PricingPage />);

    expect(await screen.findByRole('heading', { name: 'Pricing' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Try APIforge' })[0]);

    expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
  });
});
