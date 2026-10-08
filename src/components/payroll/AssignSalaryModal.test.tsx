import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignSalaryModal } from './AssignSalaryModal';

const api = vi.hoisted(() => ({
  getSalaryStructures: vi.fn(),
  getUnassignedEmployees: vi.fn(),
  assignSalary: vi.fn(),
}));

vi.mock('../../services/api', () => ({ default: api }));

vi.mock('../../components/ui/components', async () => {
  const ReactModule = await import('react');
  return {
    Dialog: ({ open, children }: any) => (open ? ReactModule.createElement('div', null, children) : null),
    Button: ({ children, ...props }: any) => ReactModule.createElement('button', props, children),
    Input: (props: any) => ReactModule.createElement('input', props),
    Label: ({ children, ...props }: any) => ReactModule.createElement('label', props, children),
  };
});

const legacyStructure = { id: 1, name: 'Default Salary Structure', basicPercent: 35, hraPercent: 50, conveyancePercent: 15, conveyanceAmount: null, pfPercent: 12 };
const grossStructure = { id: 2, name: 'Standard Gross Structure', basicPercent: 35, hraPercent: 40, conveyancePercent: 0, conveyanceAmount: 2000, pfPercent: 12 };

afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  api.getSalaryStructures.mockResolvedValue([legacyStructure, grossStructure]);
  api.getUnassignedEmployees.mockResolvedValue([]);
  api.assignSalary.mockResolvedValue({ id: 10 });
});

const renderRaise = () => render(
  <AssignSalaryModal isOpen onClose={vi.fn()} presetEmpCode="EMP007" presetEmployeeName="Asha Rao" />,
);

describe('AssignSalaryModal salary structure', () => {
  it('lists structures from the existing API and preselects the new fixed-conveyance structure', async () => {
    renderRaise();

    const select = await screen.findByLabelText(/Salary Structure/) as HTMLSelectElement;
    await waitFor(() => expect(select.value).toBe('2'));
    expect(screen.getByRole('option', { name: 'Default Salary Structure' })).toBeTruthy();
    expect(screen.getByText(/Basic 35% of Gross · HRA 40% of Basic · Conveyance ₹2,000 fixed/)).toBeTruthy();
  });

  it('shows a legacy structure as percentage conveyance', async () => {
    renderRaise();
    const select = await screen.findByLabelText(/Salary Structure/);
    await waitFor(() => expect((select as HTMLSelectElement).value).toBe('2'));

    fireEvent.change(select, { target: { name: 'structureId', value: '1' } });
    expect(screen.getByText(/Conveyance 15% of Gross/)).toBeTruthy();
  });

  it('submits Monthly Gross, Effective From and the structure, without calculating components', async () => {
    renderRaise();
    await waitFor(() => expect((screen.getByLabelText(/Salary Structure/) as HTMLSelectElement).value).toBe('2'));

    fireEvent.change(screen.getByLabelText(/Annual CTC/), { target: { name: 'annualCTC', value: '660000' } });
    fireEvent.change(screen.getByLabelText(/Monthly Gross/), { target: { name: 'monthlyGross', value: '50000' } });
    fireEvent.change(screen.getByLabelText(/Effective From/), { target: { name: 'effectiveFrom', value: '2026-11-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Give Raise' }));

    await waitFor(() => expect(api.assignSalary).toHaveBeenCalledWith({
      empCode: 'EMP007', annualCTC: 660000, monthlyGross: 50000, effectiveFrom: '2026-11-01', structureId: 2,
    }));
    // No component amounts are calculated or shown by the form
    expect(screen.queryByText('17,500')).toBeNull();
    expect(screen.queryByText('23,500')).toBeNull();
  });

  it('requires Monthly Gross', async () => {
    renderRaise();
    await waitFor(() => expect((screen.getByLabelText(/Salary Structure/) as HTMLSelectElement).value).toBe('2'));

    fireEvent.change(screen.getByLabelText(/Annual CTC/), { target: { name: 'annualCTC', value: '660000' } });
    const grossInput = screen.getByLabelText(/Monthly Gross/) as HTMLInputElement;
    expect(grossInput.required).toBe(true);
    expect(grossInput.checkValidity()).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Give Raise' }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(api.assignSalary).not.toHaveBeenCalled();
  });

  it('shows the backend rejection when components exceed Gross', async () => {
    api.assignSalary.mockRejectedValue(new Error('Basic + HRA + Conveyance cannot exceed Gross salary for this salary structure'));
    renderRaise();
    await waitFor(() => expect((screen.getByLabelText(/Salary Structure/) as HTMLSelectElement).value).toBe('2'));

    fireEvent.change(screen.getByLabelText(/Annual CTC/), { target: { name: 'annualCTC', value: '36000' } });
    fireEvent.change(screen.getByLabelText(/Monthly Gross/), { target: { name: 'monthlyGross', value: '3000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Give Raise' }));

    expect(await screen.findByText(/cannot exceed Gross salary/)).toBeTruthy();
  });
});
