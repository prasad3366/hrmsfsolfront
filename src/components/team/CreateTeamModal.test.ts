import { describe, expect, it } from 'vitest';
import { getCreateTeamCandidates } from './CreateTeamModal';
import type { EmployeeDirectoryResponse } from '../../services/api';

const response = (data: any[]): EmployeeDirectoryResponse => ({
  data,
  meta: { page: 1, pageSize: 25, total: data.length, totalPages: data.length ? 1 : 0 },
  statistics: { total: data.length, active: data.length, newJoiners: 0, onLeave: 0, probation: 0, noticePeriod: 0 },
});

describe('CreateTeamModal employee candidates', () => {
  it('reads the employee array from the API response envelope and filters approved manager roles', () => {
    const result = getCreateTeamCandidates(response([
      { id: 1, empCode: 'IT-1', role: 'IT_MANAGER' },
      { id: 2, empCode: 'SALES-1', user: { role: 'SALES_MANAGER' } },
      { id: 3, empCode: 'EMP-1', role: 'EMPLOYEE' },
    ]));

    expect(result.managers.map((employee) => employee.empCode)).toEqual(['IT-1', 'SALES-1']);
    expect(result.employees.map((employee) => employee.empCode)).toEqual(['EMP-1']);
  });

  it('keeps empty API results empty without fallback employees', () => {
    const result = getCreateTeamCandidates(response([]));

    expect(result.managers).toEqual([]);
    expect(result.employees).toEqual([]);
  });

  it('does not treat stale ADMIN or MANAGER roles as current manager roles', () => {
    const result = getCreateTeamCandidates(response([
      { id: 1, empCode: 'ADMIN-1', role: 'ADMIN' },
      { id: 2, empCode: 'MANAGER-1', role: 'MANAGER' },
    ]));

    expect(result.managers).toEqual([]);
    expect(result.employees.map((employee) => employee.empCode)).toEqual(['ADMIN-1', 'MANAGER-1']);
  });
});