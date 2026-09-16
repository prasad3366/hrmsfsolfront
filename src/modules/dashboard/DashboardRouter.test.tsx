import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../context/AuthContext';
import DashboardRouter from './DashboardRouter';
import RichDashboard from './RichDashboard';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('./RichDashboard', () => ({ default: () => <div>Rich dashboard</div> }));

const mockedUseAuth = vi.mocked(useAuth);

describe('DashboardRouter', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it.each([
    'SUPER_ADMIN', 'CEO', 'HR', 'FINANCE_MANAGER', 'IT_MANAGER', 'SALES_MANAGER', 'EMPLOYEE',
  ])('routes %s to the approved dashboard component', (role, expectedComponent) => {
    mockedUseAuth.mockReturnValue({ user: { role } } as any);

    const element = DashboardRouter();

    expect(React.isValidElement(element)).toBe(true);
    expect((element as React.ReactElement).type).toBe(RichDashboard);
  });

  it('fails closed when the authenticated role is unknown', () => {
    mockedUseAuth.mockReturnValue({ user: { role: 'UNKNOWN' } } as any);

    const element = DashboardRouter();

    expect((element as React.ReactElement).type).toBe('div');
    expect((element as React.ReactElement<{ children?: React.ReactNode }>).props.children).toContain('Access Denied');
  });

  it('renders nothing when no authenticated user exists', () => {
    mockedUseAuth.mockReturnValue({ user: null } as any);

    expect(DashboardRouter()).toBeNull();
  });
});