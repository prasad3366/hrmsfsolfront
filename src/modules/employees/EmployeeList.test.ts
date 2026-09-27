import { describe, expect, it } from 'vitest';
import { EMPLOYEE_DIRECTORY_ROLES, EMPLOYEE_360_ROLES, EMPLOYEE_PROFILE_ROUTE_ROLES, canOpenEmployee360, isEmployeeDirectoryReadOnly } from '../../App';
import { mapEmployee } from './EmployeeList';
import { canAccessEmployeeProfile } from './EmployeeProfile';

describe('employee directory integration', () => {
  it('allows EMPLOYEE to reach the directory route while keeping organization-wide Employee 360 restricted', () => {
    expect(EMPLOYEE_DIRECTORY_ROLES).toContain('EMPLOYEE');
    expect(isEmployeeDirectoryReadOnly('EMPLOYEE')).toBe(true);
    expect(EMPLOYEE_PROFILE_ROUTE_ROLES).toContain('EMPLOYEE');
    expect(canOpenEmployee360('EMPLOYEE')).toBe(false);
    expect(canOpenEmployee360('HR')).toBe(true);
    expect(EMPLOYEE_360_ROLES).toContain('HR');
  });

  it('allows EMPLOYEE to view only their own profile', () => {
    expect(canAccessEmployeeProfile('EMPLOYEE', '42', 42)).toBe(true);
    expect(canAccessEmployeeProfile('EMPLOYEE', '43', 42)).toBe(false);
    expect(canAccessEmployeeProfile('EMPLOYEE', undefined, 42)).toBe(false);
  });

  it('maps every backend directory record without exposing private fields', () => {
    const records = [
      {
        id: 2,
        empCode: 'EMP-002',
        firstName: 'Grace',
        lastName: 'Hopper',
        department: 'Engineering',
        designation: 'Compiler Engineer',
        status: 'ACTIVE',
        dateOfJoining: '2026-01-02T00:00:00.000Z',
        user: { email: 'grace@example.com', role: 'EMPLOYEE' },
        phone: '555-0100',
        bankAccountNumber: 'private',
        panNumber: 'private',
        aadharNumber: 'private',
        salary: 100000,
      },
      {
        id: 1,
        empCode: 'EMP-001',
        firstName: 'Ada',
        lastName: 'Lovelace',
        department: 'Engineering',
        designation: 'Engineer',
        status: 'ACTIVE',
        dateOfJoining: '2025-01-02T00:00:00.000Z',
        user: { email: 'ada@example.com', role: 'EMPLOYEE' },
        phone: '555-0101',
        bankAccountNumber: 'private',
        panNumber: 'private',
        aadharNumber: 'private',
        salary: 200000,
      },
    ];

    const mapped = records.map(mapEmployee);

    expect(mapped.map((employee) => employee.empCode)).toEqual(['EMP-002', 'EMP-001']);
    expect(mapped[0]).toEqual(expect.objectContaining({
      id: 2,
      name: 'Grace Hopper',
      empCode: 'EMP-002',
      department: 'Engineering',
      designation: 'Compiler Engineer',
      status: 'Active',
    }));
    expect(mapped[0]).not.toHaveProperty('email');
    expect(mapped[0]).not.toHaveProperty('phone');
    expect(mapped[0]).not.toHaveProperty('bankAccountNumber');
    expect(mapped[0]).not.toHaveProperty('panNumber');
    expect(mapped[0]).not.toHaveProperty('aadharNumber');
    expect(mapped[0]).not.toHaveProperty('salary');
  });
});
