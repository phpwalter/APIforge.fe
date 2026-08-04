import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../../state/useAppStore';
import { MethodSettingsPanel } from './MethodSettingsPanel';

const resolvedRows = [{
  http_method: 'GET', status_code: 200, title: 'OK', description: 'OK.', response_class: 2,
  is_enabled: true, is_required: true, is_default: true, display_order: 10,
  effective_source: 'system', project_overrides_allowed: true, project_plan_eligible: true,
}];

vi.mock('../../lib/api/methodPolicies', () => ({
  fetchResolvedMethodPolicy: vi.fn().mockResolvedValue({ data: resolvedRows, meta: { count: 1 } }),
  fetchMethodPolicyCodeCatalog: vi.fn().mockResolvedValue({ data: [{ code: 201, title: 'Created', description: 'Created.', response_class: 2 }], meta: { count: 1 } }),
  saveMethodPolicyOverride: vi.fn().mockResolvedValue({ data: {} }),
}));

describe('MethodSettingsPanel scope visibility', () => {
  beforeEach(() => {
    useAppStore.setState({
      userProfile: { name: 'User', email: 'user@example.com', roles: [], companyId: undefined, planCode: undefined },
      currentProjectId: null,
      currentProjectName: null,
    });
  });

  it('shows static NONE and disables Add Code for an ordinary user without project permission', async () => {
    render(<MethodSettingsPanel />);
    expect(await screen.findByLabelText('Configuration Scope value')).toHaveTextContent('NONE');
    expect(screen.queryByRole('combobox', { name: 'Configuration Scope' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add code/i })).toBeDisabled();
    expect(screen.queryByText('System Defaults')).not.toBeInTheDocument();
  });

  it('shows only Company as static text for a company administrator', async () => {
    useAppStore.setState({ userProfile: { name: 'Admin', email: 'admin@example.com', roles: ['administrator'], companyId: '11111111-1111-4111-8111-111111111111', planCode: 'free' } });
    render(<MethodSettingsPanel />);
    expect(await screen.findByLabelText('Configuration Scope value')).toHaveTextContent('Company: APIForge');
    expect(screen.queryByText('System Defaults')).not.toBeInTheDocument();
  });

  it('shows Project to an ordinary user only when company policy and plan permit it', async () => {
    useAppStore.setState({
      userProfile: { name: 'Project User', email: 'project@example.com', roles: ['user'], companyId: '11111111-1111-4111-8111-111111111111', planCode: 'pro' },
      currentProjectId: '22222222-2222-4222-8222-222222222222',
      currentProjectName: 'Customer API',
    });
    render(<MethodSettingsPanel />);
    expect(await screen.findByLabelText('Configuration Scope value')).toHaveTextContent('Project: Customer API');
    expect(screen.queryByText('System Defaults')).not.toBeInTheDocument();
    expect(screen.queryByText('Company: APIForge')).not.toBeInTheDocument();
  });

  it('shows all authorized scopes to a super administrator who is also a company administrator', async () => {
    useAppStore.setState({
      userProfile: { name: 'Super', email: 'super@example.com', roles: ['super_administrator', 'administrator'], companyId: '11111111-1111-4111-8111-111111111111', planCode: 'pro' },
      currentProjectId: '22222222-2222-4222-8222-222222222222',
      currentProjectName: 'Customer API',
    });
    render(<MethodSettingsPanel />);
    const selector = await screen.findByRole('combobox', { name: 'Configuration Scope' });
    expect(selector).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'System Defaults' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Company: APIForge' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Project: Customer API' })).toBeInTheDocument();
    fireEvent.change(selector, { target: { value: 'system' } });
    await waitFor(() => expect(selector).toHaveValue('system'));
  });
});
