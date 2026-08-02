import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeaderConfigSettingsPanel } from './HeaderConfigSettingsPanel';

describe('HeaderConfigSettingsPanel', () => {
  it('renders request policy controls and opens the rule editor', () => {
    render(<HeaderConfigSettingsPanel />);

    expect(screen.getByRole('button', { name: 'REQUEST' })).toBeInTheDocument();
    expect(screen.getByText('Idempotency-Key')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search headers...')).toBeInTheDocument();

    const actions = screen.getAllByTitle('More actions');
    fireEvent.click(actions[2]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit Rule' }));

    expect(screen.getByRole('dialog', { name: 'Edit Header Rule' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Configuration Scope/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Policy Type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Condition/)).toBeInTheDocument();
  });

  it('saves edited category and policy type into the table', () => {
    render(<HeaderConfigSettingsPanel />);
    fireEvent.click(screen.getAllByTitle('More actions')[2]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit Rule' }));

    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'Authentication' } });
    fireEvent.change(screen.getByLabelText(/Policy Type/), { target: { value: 'required' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Rule' }));

    expect(screen.queryByRole('dialog', { name: 'Edit Header Rule' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Authentication').length).toBeGreaterThan(0);
  });
  it('dismisses the category filter when clicking outside the filter region', () => {
    render(<HeaderConfigSettingsPanel />);

    fireEvent.click(screen.getByRole('button', { name: /selected/i }));
    expect(screen.getByRole('button', { name: 'Clear All' })).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole('button', { name: 'Clear All' })).not.toBeInTheDocument();
  });


  it('opens the row actions menu and dismisses it outside the menu', () => {
    render(<HeaderConfigSettingsPanel />);

    fireEvent.click(screen.getAllByTitle('More actions')[0]);

    expect(screen.getByRole('menuitem', { name: 'Edit Rule' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Duplicate Rule' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Reset to System Default' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Disable Override' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete Override' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'View Audit History' })).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menuitem', { name: 'Edit Rule' })).not.toBeInTheDocument();
  });

  it('keeps Active and Default Enabled functionally independent', () => {
    render(<HeaderConfigSettingsPanel />);
    fireEvent.click(screen.getAllByTitle('More actions')[0]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit Rule' }));

    const activeSwitch = screen.getByLabelText('Rule active');
    const defaultEnabledSwitch = screen.getByLabelText('Default enabled');

    expect(activeSwitch).toBeChecked();
    expect(defaultEnabledSwitch).toBeChecked();

    fireEvent.click(defaultEnabledSwitch);

    expect(activeSwitch).toBeChecked();
    expect(defaultEnabledSwitch).not.toBeChecked();
  });

  it('opens the rule editor when a header row is double-clicked', () => {
    render(<HeaderConfigSettingsPanel />);

    const headerCell = screen.getByText('Idempotency-Key');
    const row = headerCell.closest('tr');
    expect(row).not.toBeNull();

    fireEvent.doubleClick(row!);

    expect(screen.getByRole('dialog', { name: 'Edit Header Rule' })).toBeInTheDocument();
    expect(screen.getByText('Update the configuration for this request header rule.')).toBeInTheDocument();
  });

  it('sorts by one selected column and reverses direction on a second click', () => {
    render(<HeaderConfigSettingsPanel />);

    const getVisibleHeaderNames = () => screen.getAllByRole('row').slice(1).map((row) => row.querySelector('strong')?.textContent ?? '');
    const headerSort = screen.getByRole('button', { name: /Sort by Header/ });

    expect(headerSort).toHaveAttribute('aria-label', expect.stringContaining('ascending'));
    const ascending = getVisibleHeaderNames();

    fireEvent.click(headerSort);

    expect(headerSort).toHaveAttribute('aria-label', expect.stringContaining('descending'));
    expect(getVisibleHeaderNames()).toEqual([...ascending].reverse());

    fireEvent.click(screen.getByRole('button', { name: /Sort by Category/ }));

    expect(screen.getByRole('columnheader', { name: /Category/ })).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('columnheader', { name: /Header/ })).toHaveAttribute('aria-sort', 'none');
  });

});

// Response-direction behavior is intentionally covered separately from request policies.
describe('HeaderConfigSettingsPanel response tab', () => {
  it('renders response policies and status-code controls', () => {
    render(<HeaderConfigSettingsPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'RESPONSE' }));

    expect(screen.getByText('Configure RESPONSE header policies by HTTP status code.')).toBeInTheDocument();
    expect(screen.getByLabelText('HTTP status code')).toHaveValue('200');
    expect(screen.getByText('Cache-Control')).toBeInTheDocument();
    expect(screen.getByText('ETag')).toBeInTheDocument();
    expect(screen.getByText(/Response header policies are loaded from the database/)).toBeInTheDocument();
  });

  it('opens a response rule in the existing editor', () => {
    render(<HeaderConfigSettingsPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'RESPONSE' }));
    fireEvent.click(screen.getAllByTitle('More actions')[0]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit Rule' }));

    expect(screen.getByRole('dialog', { name: 'Edit Header Rule' })).toBeInTheDocument();
    expect(screen.getByText('Update the configuration for this response header rule.')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Applies To/)[0]).toHaveValue('200');
  });

  it('filters request header policies by HTTP method', () => {
    render(<HeaderConfigSettingsPanel />);

    expect(screen.getByText('Idempotency-Key')).toBeInTheDocument();
    expect(screen.queryByText('If-None-Match')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('HTTP method'), { target: { value: 'GET' } });

    expect(screen.queryByText('Idempotency-Key')).not.toBeInTheDocument();
    expect(screen.getByText('If-None-Match')).toBeInTheDocument();
    expect(screen.queryByText('Content-Type')).not.toBeInTheDocument();
  });

});
