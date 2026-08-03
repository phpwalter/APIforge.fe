import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MethodSettingsPanel } from './MethodSettingsPanel';

vi.mock('../../lib/api/methodPolicies', () => ({
  fetchResolvedMethodPolicy: vi.fn().mockResolvedValue({ data: [], meta: { count: 0 } }),
}));

describe('MethodSettingsPanel', () => {
  it('renders the three policy scopes and method selector', () => {
    render(<MethodSettingsPanel />);
    expect(screen.getByText('System Defaults')).toBeInTheDocument();
    expect(screen.getByText('Company: APIForge')).toBeInTheDocument();
    expect(screen.getByText('Project: Current Project')).toBeInTheDocument();
    expect(screen.getByText('HTTP Method')).toBeInTheDocument();
  });
});
