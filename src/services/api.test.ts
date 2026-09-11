import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  removeItem: vi.fn(),
  setItem: vi.fn(),
});

const { default: api, normalizeEmployeeDirectoryResponse } = await import('./api');
const { normalizeWfhResponse } = await import('./api');
const { hasAccessToken } = await import('../context/AuthContext');

describe('getEmployeeIdByUserId', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => (
      key === 'accessToken' ? 'test-access-token' : null
    ));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the employee ID from the /employees/me endpoint', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 42 }), { status: 200 }),
    );

    await expect(api.getEmployeeIdByUserId()).resolves.toEqual({ employeeId: 42 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/employees/me',
      expect.objectContaining({ method: 'GET' }),
    );
    expect((fetchMock.mock.calls[0][1].headers as Headers).get('Authorization'))
      .toBe('Bearer test-access-token');
  });

  it('uses the token storage key when accessToken is unavailable', async () => {
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => (
      key === 'token' ? 'legacy-token' : null
    ));
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 42 }), { status: 200 }));

    await api.getEmployeeIdByUserId();

    expect((fetchMock.mock.calls[0][1].headers as Headers).get('Authorization'))
      .toBe('Bearer legacy-token');
  });

  it('returns the employee ID from the /employees/info/id endpoint', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ employeeId: 84 }), { status: 200 }));

    await expect(api.getEmployeeIdByUserId()).resolves.toEqual({ employeeId: 84 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('preserves the existing error and never falls back to another employee', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    const getAllEmployees = vi.spyOn(api, 'getAllEmployees');
    getAllEmployees.mockResolvedValue([{ id: 999 }]);

    await expect(api.getEmployeeIdByUserId()).rejects.toThrow('Failed to get employee ID');
    expect(getAllEmployees).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not attach the stored token to the public login endpoint', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ accessToken: 'new-token', refreshToken: 'refresh-token', role: 'SUPER_ADMIN' }), { status: 200 }),
    );

    await api.login('admin@example.com', 'password');

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.headers).not.toHaveProperty('Authorization');
  });

  it('persists the login response token and uses it on the next authenticated request', async () => {
    const storedTokens = new Map<string, string>();
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => storedTokens.get(key) ?? null);
    vi.mocked(localStorage.setItem).mockImplementation((key: string, value: string) => {
      storedTokens.set(key, value);
    });
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        accessToken: 'login-access-token',
        refreshToken: 'login-refresh-token',
        role: 'SUPER_ADMIN',
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 42 }), { status: 200 }));

    await api.login('admin@example.com', 'password');
    await api.getEmployeeIdByUserId();

    expect(storedTokens.get('accessToken')).toBe('login-access-token');
    expect(storedTokens.get('refreshToken')).toBe('login-refresh-token');
    expect((fetchMock.mock.calls[1][1].headers as Headers).get('Authorization'))
      .toBe('Bearer login-access-token');
  });

  it('does not treat a stored user profile without an access token as an API session', () => {
    expect(hasAccessToken(null)).toBe(false);
    expect(hasAccessToken('')).toBe(false);
    expect(hasAccessToken('stored-access-token')).toBe(true);
  });
});

describe('Employee 360 API methods', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['getEmployee360', () => api.getEmployee360(42), '/employees/42/360'],
    ['getEmployee360Leave', () => api.getEmployee360Leave(42), '/employees/42/360/leave'],
    ['getEmployee360Hierarchy', () => api.getEmployee360Hierarchy(42), '/employees/42/360/hierarchy'],
    ['getEmployee360Assets', () => api.getEmployee360Assets(42), '/employees/42/360/assets'],
    ['getEmployee360Documents', () => api.getEmployee360Documents(42), '/employees/42/360/documents'],
    ['getEmployee360Payroll', async () => {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([{ month: 9, year: 2026 }]), { status: 200 }));
      await expect(api.getEmployee360Payroll(42)).resolves.toEqual([{ month: 9, year: 2026 }]);
    }, '/employees/42/360/payroll'],
  ])('%s uses the Employee 360 endpoint', async (_name, request, path) => {
    await request();
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/api${path}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('getEmployee360Attendance encodes and sends the month query', async () => {
    await api.getEmployee360Attendance(42, '2026-09');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/employees/42/360/attendance?month=2026-09',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('uploads documents as multipart FormData with the required content type', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ uploaded: true }), { status: 200 }));
    const file = new File(['document'], 'identity.pdf', { type: 'application/pdf' });

    await api.uploadDocuments(42, [7], [file]);

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.body).toBeInstanceOf(FormData);
    expect((request.body as FormData).get('employeeId')).toBe('42');
    const headers = new Headers(request.headers);
    expect(headers.get('Content-Type')).toBeNull();
    expect(headers.get('Authorization')).toBe('Bearer test-access-token');
  });

  it('propagates the existing-style error for a failed 360 request', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }));

    await expect(api.getEmployee360Payroll(42)).rejects.toThrow('Failed to fetch employee 360 payroll');
  });
});

describe('Attendance history API', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      data: [{ id: 1, date: '2026-09-08', status: 'PRESENT' }],
      meta: { page: 2, pageSize: 10, total: 11, totalPages: 2, month: 9, year: 2026 },
    }), { status: 200 }));
  });

  it('requests the current-month page and returns pagination metadata', async () => {
    await expect(api.getMyAttendance(9, 2026, 2, 10)).resolves.toMatchObject({
      data: [expect.objectContaining({ id: 1, date: '2026-09-08', status: 'ABSENT', punchIn: null, punchOut: null })],
      meta: { page: 2, pageSize: 10, total: 11, totalPages: 2, month: 9, year: 2026 },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/attendance/my-history?month=9&year=2026&page=2&pageSize=10',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('maps backend clock fields to the attendance table fields', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      data: [{
        id: 1,
        date: '2026-09-09',
        clockIn: '2026-09-09T09:00:00.000Z',
        clockOut: null,
        status: 'PRESENT',
      }],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1, month: 9, year: 2026 },
    }), { status: 200 }));

    await expect(api.getMyAttendance(9, 2026)).resolves.toMatchObject({
      data: [expect.objectContaining({
        punchIn: '2026-09-09T09:00:00.000Z',
        punchOut: null,
        status: 'IN_PROGRESS',
      })],
    });
  });

  it('preserves both clock timestamps for a completed history record', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      data: [{
        id: 11,
        date: '2026-09-11',
        clockIn: '2026-09-11T07:28:00.000Z',
        clockOut: '2026-09-11T16:45:00.000Z',
        status: 'PRESENT',
      }],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1, month: 9, year: 2026 },
    }), { status: 200 }));

    await expect(api.getMyAttendance(9, 2026)).resolves.toMatchObject({
      data: [expect.objectContaining({
        punchIn: '2026-09-11T07:28:00.000Z',
        punchOut: '2026-09-11T16:45:00.000Z',
        status: 'PRESENT',
      })],
    });
  });

  it('uses the backend today attendance endpoint', async () => {
    const todayStatus = {
      hasPunchedIn: true,
      hasPunchedOut: false,
      punchInTime: '2026-09-09T09:00:00.000Z',
      punchOutTime: null,
      locationStatus: null,
      totalHours: 0,
      status: 'IN_PROGRESS',
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(todayStatus), { status: 200 }));

    await expect(api.getTodayStatus()).resolves.toEqual(todayStatus);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/attendance/today',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('normalizes today clock aliases and envelopes into the canonical state', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      data: {
        clockIn: '2026-09-09T09:00:00.000Z',
        clockOut: null,
        status: 'IN_PROGRESS',
      },
    }), { status: 200 }));

    await expect(api.getTodayStatus()).resolves.toMatchObject({
      hasPunchedIn: true,
      hasPunchedOut: false,
      punchInTime: '2026-09-09T09:00:00.000Z',
      punchOutTime: null,
      status: 'IN_PROGRESS',
    });
  });
});

describe('employee directory query', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('sends server-side search and pagination parameters and preserves response.data', async () => {
    const response = {
      data: [{ id: 42, firstName: 'Ada', lastName: 'Lovelace', empCode: 'EMP-42', designation: 'Engineer' }],
      meta: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
      statistics: { total: 1, active: 1, newJoiners: 0, onLeave: 0, probation: 0, noticePeriod: 0 },
    };
    fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify(response), { status: 200 })));

    await expect(api.getAllEmployees({ search: 'Ada', page: 1, pageSize: 25 })).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/employees?search=Ada&page=1&pageSize=25',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock.mock.calls[0][0]).not.toMatch(/role|managerId|teamId|employeeId/);
  });

  it('sends the access token for the employee directory and Documents requests', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify([]), { status: 200 })));

    await api.getAllEmployees();
    await api.getDocuments(42, 'SUPER_ADMIN');

    for (const [, request] of fetchMock.mock.calls) {
      expect(new Headers((request as RequestInit).headers).get('Authorization'))
        .toBe('Bearer test-access-token');
    }
  });

  it('normalizes an employee envelope while preserving pagination metadata', () => {
    const employee = { id: 42, firstName: 'Ada' };
    const result = normalizeEmployeeDirectoryResponse({
      data: [employee],
      meta: { page: 2, pageSize: 25, total: 26, totalPages: 2 },
      statistics: { total: 26, active: 25, newJoiners: 1, onLeave: 0, probation: 0, noticePeriod: 0 },
    });

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toEqual([employee]);
    expect(result.meta.page).toBe(2);
    expect(result.data.map((item) => item.id)).toEqual([42]);
  });

  it('normalizes an empty employee array without creating fake rows', () => {
    const result = normalizeEmployeeDirectoryResponse([]);

    expect(result.data).toEqual([]);
    expect(result.data.map((item) => item.id)).toEqual([]);
  });

  it('preserves the existing API error behavior', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(api.getAllEmployees()).rejects.toThrow('Failed to fetch employees from API endpoint');
  });

  it('uses the attendance employee endpoint contract for initial and searched lists', async () => {
    const response = {
      data: [{ id: 42, firstName: 'Ada', lastName: 'Lovelace' }],
      meta: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
      statistics: { total: 1, active: 1, newJoiners: 0, onLeave: 0, probation: 0, noticePeriod: 0 },
    };
    fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify(response), { status: 200 })));

    await expect(api.getAttendanceEmployees()).resolves.toEqual(response);
    await expect(api.getAttendanceEmployees('Ada Lovelace')).resolves.toEqual(response);

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/attendance/employees');
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:3000/api/attendance/employees?search=Ada+Lovelace');
    expect(fetchMock.mock.calls.every(([url]) => !String(url).match(/role|managerId|teamId|employeeId/))).toBe(true);
  });

  it('provides Documents with an employee array from the normalized response', async () => {
    const employee = { id: 42, firstName: 'Ada', lastName: 'Lovelace' };
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      data: [employee],
      meta: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
      statistics: { total: 1, active: 1, newJoiners: 0, onLeave: 0, probation: 0, noticePeriod: 0 },
    }), { status: 200 }));

    const response = await api.getAllEmployees();
    const employeeList = response.data;

    expect(Array.isArray(employeeList)).toBe(true);
    expect(employeeList.map((item) => item.id)).toEqual([42]);
  });
});

describe('self attendance punch API', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => (
      key === 'accessToken' ? 'test-access-token' : null
    ));
  });

  it('uses the active today-status endpoint and preserves server timestamps', async () => {
    const today = {
      hasPunchedIn: true,
      hasPunchedOut: true,
      punchInTime: '2026-09-09T09:00:00.000Z',
      punchOutTime: '2026-09-09T17:00:00.000Z',
      totalHours: 8,
      locationStatus: null,
      status: 'COMPLETED',
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(today), { status: 200 }));

    await expect(api.getTodayStatus()).resolves.toEqual(today);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/attendance/today',
      expect.objectContaining({ method: 'GET' }),
    );
    expect((fetchMock.mock.calls[0][1].headers as Headers).get('Authorization'))
      .toBe('Bearer test-access-token');
  });

  it('sends punch requests without a client employee identity', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 200 }));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 200 }));

    await api.punchIn(1, 2);
    await api.punchOut(1, 2);

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/attendance/punch-in');
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:3000/api/attendance/punch-out');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ latitude: 1, longitude: 2 });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({ latitude: 1, longitude: 2 });
  });
});

describe('monthly self attendance query', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 0, month: 8, year: 2026 } }), { status: 200 }));
  });

  it('sends the selected month and year to the existing monthly endpoint', async () => {
    await api.getMyAttendance(8, 2026, 1, 10);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/attendance/my-history?month=8&year=2026&page=1&pageSize=10',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('uses the backend selected-month dataset and one-page metadata unchanged', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      data: [
        { id: 1, date: '2026-08-01', status: 'PRESENT' },
        { id: 2, date: '2026-08-31', status: 'ABSENT' },
      ],
      meta: { page: 1, pageSize: 2, total: 2, totalPages: 1, month: 8, year: 2026 },
    }), { status: 200 }));

    await expect(api.getMyAttendance(8, 2026, 1, 10)).resolves.toMatchObject({
      data: [expect.objectContaining({ id: 1 }), expect.objectContaining({ id: 2 })],
      meta: { page: 1, pageSize: 2, total: 2, totalPages: 1, month: 8, year: 2026 },
    });
  });
});

describe('employee attendance query', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
  });

  it('builds the employee attendance route with monthly filters', async () => {
    await api.getEmployeeAttendance(42, 9, 2026, 'ABSENT');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/attendance/employee/42/monthly?month=9&year=2026&status=ABSENT&page=1&pageSize=10',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('normalizes employee attendance envelopes and preserves pagination metadata', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      data: [{ id: 7, employeeId: 42, date: '2026-09-09', clockIn: '2026-09-09T09:00:00.000Z', clockOut: null }],
      meta: { page: 2, pageSize: 10, total: 21, totalPages: 3, month: 9, year: 2026 },
    }), { status: 200 }));

    await expect(api.getEmployeeAttendance(42, 9, 2026, undefined, 2, 10)).resolves.toEqual({
      data: [expect.objectContaining({ id: 7, punchIn: '2026-09-09T09:00:00.000Z', punchOut: null, status: 'IN_PROGRESS' })],
      meta: { page: 2, pageSize: 10, total: 21, totalPages: 3, month: 9, year: 2026 },
    });
  });

  it('preserves completed ABSENT status in employee attendance details', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      data: [{
        id: 22,
        employeeId: 42,
        date: '2026-09-11',
        clockIn: '2026-09-11T08:57:46.091Z',
        clockOut: '2026-09-11T08:58:11.508Z',
        totalHours: 0.007,
        status: 'ABSENT',
      }],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1, month: 9, year: 2026 },
    }), { status: 200 }));

    await expect(api.getEmployeeAttendance(42, 9, 2026)).resolves.toEqual({
      data: [expect.objectContaining({
        id: 22,
        punchIn: '2026-09-11T08:57:46.091Z',
        punchOut: '2026-09-11T08:58:11.508Z',
        totalHours: 0.007,
        status: 'ABSENT',
      })],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1, month: 9, year: 2026 },
    });
  });
});

describe('unassigned employee salary query', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('fetches and extracts unassigned employees from the salary endpoint', async () => {
    const employees = [{ id: 5, empCode: 'EMP-005', firstName: 'Ada', lastName: 'Lovelace', designation: 'Engineer' }];
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: employees }), { status: 200 }));

    await expect(api.getUnassignedEmployees()).resolves.toEqual(employees);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/salary/unassigned-employees',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('announcement employee feed', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('loads the feed route and preserves General and Pinned notices', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [
      { id: 1, title: 'General update', category: 'General', isPinned: false },
      { id: 2, title: 'Pinned update', category: 'GENERAL', pinStatus: 'Pinned' },
    ] }), { status: 200 }));

    await expect(api.getAnnouncements()).resolves.toEqual([
      { id: 1, title: 'General update', category: 'GENERAL', isPinned: false },
      { id: 2, title: 'Pinned update', category: 'GENERAL', pinStatus: 'Pinned', isPinned: true },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/announcements/feed',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('leave carry-forward API', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('sends the carry-forward request to the backend route with the existing payload', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Carry forward requested successfully' }), { status: 200 }),
    );

    await expect(api.requestCarryForward(5, 2026)).resolves.toEqual({
      message: 'Carry forward requested successfully',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/leaves/carry-forward',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ leaveTypeId: 5, yearStart: 2026 }),
      }),
    );
  });
});

describe('assets assignment and return API', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 12, status: 'ASSIGNED' }), { status: 200 }));
  });

  it('preserves the employeeId assignment contract', async () => {
    await api.assignAsset({ assetId: 12, employeeId: 7 });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/assets/assign',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ assetId: 12, employeeId: 7 }),
      }),
    );
  });

  it('preserves the return endpoint and empty request body', async () => {
    await api.returnAsset(12);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/assets/return/12',
      expect.objectContaining({ method: 'PUT' }),
    );
    expect((fetchMock.mock.calls[0][1] as RequestInit).body).toBeUndefined();
  });
});

describe('helpdesk status API', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => (
      key === 'accessToken' ? 'helpdesk-test-token' : null
    ));
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ status: 'OK' }), { status: 200 }));
  });

  it('approves with PATCH, the existing URL, no body, and auth headers', async () => {
    await api.approveHelpdeskTicket('42');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/helpdesk/tickets/42/approve',
      expect.objectContaining({ method: 'PATCH' }),
    );
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.body).toBeUndefined();
    expect((request.headers as Headers).get('Authorization')).toBe(
      'Bearer helpdesk-test-token',
    );
  });

  it('resolves with PATCH, the existing URL, no body, and auth headers', async () => {
    await api.resolveHelpdeskTicket('42');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/helpdesk/tickets/42/resolve',
      expect.objectContaining({ method: 'PATCH' }),
    );
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.body).toBeUndefined();
    expect((request.headers as Headers).get('Authorization')).toBe(
      'Bearer helpdesk-test-token',
    );
  });
});

describe('WFH API contract', () => {
  const request = { startDate: '2026-09-10', endDate: '2026-09-12', reason: 'Home appointment' };

  beforeEach(() => {
    fetchMock.mockReset();
    vi.mocked(localStorage.getItem).mockReturnValue('test-access-token');
  });

  it('sends only the WFH request fields and accepts a direct array', async () => {
    const created = { id: 1, ...request, status: 'PENDING' };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(created), { status: 200 }));

    await api.requestWfh(request);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(request);
    expect(fetchMock.mock.calls[0][1].body).not.toMatch(/employeeId|teamId|managerId/);
  });

  it.each([
    ['array', [{ id: 1 }]],
    ['data envelope', { data: [{ id: 1 }] }],
    ['requests envelope', { requests: [{ id: 1 }] }],
  ])('normalizes a WFH %s response', (_shape, payload) => {
    expect(normalizeWfhResponse(payload)).toEqual([{ id: 1 }]);
  });

  it('rejects malformed WFH list responses', () => {
    expect(() => normalizeWfhResponse({ data: { id: 1 } })).toThrow('Unexpected WFH response format');
  });

  it.each([
    ['my', () => api.getMyWfhRequests()],
    ['all', () => api.getAllWfhRequests()],
  ])('preserves failure for GET /wfh/%s instead of returning an empty list', async (_name, requestFn) => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(requestFn()).rejects.toThrow('Failed to fetch WFH requests');
  });

  it('updates through the approve and reject endpoints without client identity fields', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, status: 'APPROVED' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, status: 'REJECTED' }), { status: 200 }));

    await expect(api.approveWfh(1)).resolves.toMatchObject({ status: 'APPROVED' });
    await expect(api.rejectWfh(1)).resolves.toMatchObject({ status: 'REJECTED' });
    expect(fetchMock.mock.calls.every(([url]) => !url.match(/employeeId|teamId|managerId/))).toBe(true);
  });
});
