import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Login from './Login';

const mockLogin = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
  }),
}));

describe('Login password visibility toggle', () => {
  beforeEach(() => {
    mockLogin.mockReset();
  });

  it('toggles password visibility without changing the input value', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/password/i, { selector: 'input' }) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    expect(passwordInput.type).toBe('password');
    expect(passwordInput.value).toBe('');

    await user.type(passwordInput, 'TestPassword123');

    expect(passwordInput.value).toBe('TestPassword123');
    expect(passwordInput.type).toBe('password');

    await user.click(toggleButton);

    expect((screen.getByLabelText(/password/i, { selector: 'input' }) as HTMLInputElement).type).toBe('text');
    expect((screen.getByLabelText(/password/i, { selector: 'input' }) as HTMLInputElement).value).toBe('TestPassword123');

    const toggledButton = screen.getByRole('button', { name: /hide password/i });
    await user.click(toggledButton);

    expect((screen.getByLabelText(/password/i, { selector: 'input' }) as HTMLInputElement).type).toBe('password');
    expect((screen.getByLabelText(/password/i, { selector: 'input' }) as HTMLInputElement).value).toBe('TestPassword123');
  });
});
