import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ApiService from '../../services/api';
import { CreateEmployeeModal } from './CreateEmployeeModal';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CreateEmployeeModal', () => {
  it('displays backend create errors to the user', async () => {
    vi.spyOn(ApiService, 'createEmployee').mockRejectedValue(
      new Error('Email already exists (HTTP 400)'),
    );

    render(
      <CreateEmployeeModal
        isOpen
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'New' } });
    fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Employee' } });
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Employee Code/), { target: { value: 'EMP-42' } });
    fireEvent.change(screen.getByLabelText(/Department/), { target: { value: 'Engineering' } });
    fireEvent.change(screen.getByLabelText(/Designation/), { target: { value: 'Developer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Employee' }));

    expect(await screen.findByText('Email already exists (HTTP 400)')).toBeTruthy();
  });
});
