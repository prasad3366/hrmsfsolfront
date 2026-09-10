import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../context/AuthContext';
import DashboardRouter from './DashboardRouter';
import AdminDashboard from './AdminDashboard';
import HRDashboard from './HRDashboard';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('./AdminDashboard', () => ({ default: () => <div>Admin dashboard</div> }));
vi.mock('./HRDashboard', () => ({ default: () => <div>HR dashboard</div> }));
vi.mock('./ManagerDashboard', () => ({ default: () => <div>Manager dashboard</div> }));
vi.mock('./EmployeeDashboard', () => ({ default: () => <div>Employee dashboard</div> }));

const mockedUseAuth = vi.mocked(useAuth);

describe('DashboardRouter', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it.each([
    ['SUPER_ADMIN', AdminDashboard],
    ['CEO', AdminDashboard],
    ['HR', HRDashboard],
    ['FINANCE_MANAGER', EmployeeDashboard],
    ['IT_MANAGER', ManagerDashboard],
    ['SALES_MANAGER', ManagerDashboard],
    ['EMPLOYEE', EmployeeDashboard],
  ])('routes %s to the approved dashboard component', (role, expectedComponent) => {
    mockedUseAuth.mockReturnValue({ user: { role } } as any);

    const element = DashboardRouter();

    expect(React.isValidElement(element)).toBe(true);
    expect((element as React.ReactElement).type).toBe(expectedComponent);
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