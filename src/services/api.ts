// Get API base URL from environment or use default
const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000/api';

console.log('API Base URL:', API_BASE_URL);

export interface LoginResponse {
  message: string;
  role: string;
  dashboard: string;
  accessToken: string;
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Attendance Types
export interface PunchDto {
  latitude: number;
  longitude: number;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  punchIn: string;
  punchOut: string | null;
  punchInLat: number | null;
  punchInLng: number | null;
  punchOutLat: number | null;
  punchOutLng: number | null;
  totalHours: number;
  overtime: number;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY';
  locationStatus?: 'OFFICE' | 'OUTSIDE' | 'WFH'; // Added locationStatus property
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  isCurrentUser?: boolean; // Indicates if the record belongs to the current user
}

export interface OfficeLocationDto {
  latitude: number;
  longitude: number;
  radius: number;
  address?: string;
}

export interface CreateEmployeeDto {
  email: string;
  firstName: string;
  lastName: string;
  empCode: string;
  department: string;
  designation: string;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE';
  sourceOfHire?: string;
  dateOfJoining?: string;
  currentExperience?: number;
  reportingManager?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  currentAddress?: string;
  permanentAddress?: string;
  pincode?: string;
  city?: string;
  maritalStatus?: 'UNMARRIED' | 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  phone?: string;
  personalMobile?: string;
  panNumber?: string;
  aadharNumber?: string;
  pfNumber?: string;
  uanNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  dateOfExit?: string;
  isExperienced?: boolean;
}

export interface CreateEmployeeResponse {
  message: string;
  username: string;
  password: string;
  role: string;
}

// Asset Types
export interface CreateAssetDto {
  name: string;
  assetTag: string;
  type: string;
  brand?: string;
  model?: string;
  purchaseDate?: string | Date;
}

export interface AssignAssetDto {
  assetId: number;
  employeeId: number;
}

export interface AssetAssignment {
  id: number;
  assetId: number;
  employeeId: number;
  assignedAt: string;
  returnedAt?: string;
}

export interface Asset {
  id: number;
  name: string;
  assetTag: string;
  type: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED';
  createdAt: string;
  updatedAt: string;
  assignments?: AssetAssignment[];
}

// WFH (Work From Home) Types
export interface RequestWfhDto {
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
}

export interface WfhRequest {
  id: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    empCode: string;
    firstName: string;
    lastName: string;
    department: string;
  };
}

// Leave Types
export interface CreateLeaveDto {
  leaveTypeId: number;
  startDate: string | Date;
  endDate: string | Date;
  durationType?: 'FULL_DAY' | 'HALF_DAY' | 'HALF_DAY_FIRST' | 'HALF_DAY_SECOND';
  reason: string;
}

export interface Leave {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  durationType: 'FULL_DAY' | 'HALF_DAY' | 'HALF_DAY_FIRST' | 'HALF_DAY_SECOND';
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  yearStart: number;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    empCode: string;
    firstName: string;
    lastName: string;
  };
  leaveType?: {
    id: number;
    name: string;
  };
}

export interface LeaveBalance {
  employeeId: number;
  employeeName: string;
  leaveType: string;
  allocated: number;
  used: number;
  remaining: number;
  carryForward: number;
}

export interface LeaveType {
  leaveType: string;
  allocated: number;
  used: number;
  carryForward: number;
  remaining: number;
}

// Holiday Types
export interface Holiday {
  id: number;
  name: string;
  date: string;
  description?: string;
  isOptional: boolean;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayDto {
  name: string;
  date: string | Date;
  description?: string;
  isOptional?: boolean;
  location?: string;
}

export interface UpdateHolidayDto {
  name?: string;
  date?: string | Date;
  description?: string;
  isOptional?: boolean;
  location?: string;
}

// =========== PAYROLL TYPES ===========

export interface RunPayrollDto {
  employeeId: number;
  month: number;
  year: number;
}

export interface PayrollAdjustment {
  id: number;
  payrollId: number;
  name: string;
  type: 'ALLOWANCE' | 'DEDUCTION';
  amount: number;
  createdAt?: string;
}

export interface Payroll {
  id: number;
  employeeId: number;
  salaryId: number;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  lopDays: number;
  basic: number;
  hra: number;
  pf: number;
  pt: number;
  healthInsurance: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  others?: PayrollAdjustment[];
  createdAt?: string;
  updatedAt?: string;
}

// =========== SALARY TYPES ===========

export interface AssignSalaryDto {
  employeeId?: number;
  empCode?: string;
  annualCTC: number;
  structureId: number;
}

export interface EmployeeSalary {
  id: number;
  employeeId: number;
  structureId: number;
  annualCTC: number;
  monthlyCTC: number;
  effectiveFrom: string;
  createdAt?: string;
  updatedAt?: string;
}

class ApiService {
  private static instance: ApiService;

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const url = `${API_BASE_URL}/auth/login`;
      console.log('Login request to:', url);
      console.log('Payload:', { email, password });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Login error:', error);
        throw new Error(error.message || 'Login failed');
      }

      const data: LoginResponse = await response.json();
      
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      return data;
    } catch (error) {
      console.error('Login exception:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed. Please try again.');
    }
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Update tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      return data;
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw new Error('Token refresh failed');
    }
  }

  async logout(): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      return await response.json();
    } catch (error) {
      // Clear tokens anyway
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw new Error('Logout failed');
    }
  }

  async forgotPassword(email: string, newPassword?: string, otp?: string): Promise<{ message: string }> {
    try {
      const payload: { email: string; newPassword?: string; otp?: string } = { email };
      if (newPassword) payload.newPassword = newPassword;
      if (otp) payload.otp = otp;

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Forgot password request failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Forgot password request failed');
    }
  }

  // =========== ATTENDANCE ENDPOINTS ===========

  async punchIn(latitude?: number, longitude?: number): Promise<AttendanceRecord> {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/punch-in`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Punch in failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Punch in failed');
    }
  }

  async punchOut(latitude?: number, longitude?: number): Promise<AttendanceRecord> {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/punch-out`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Punch out failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Punch out failed');
    }
  }

  async getAttendance(): Promise<AttendanceRecord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/all`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance records');
      }

      const data = await response.json();

      // Ensure employee details are included in the response
      return data.map((record: AttendanceRecord) => ({
        ...record,
        employee: record.employee || { firstName: 'Unknown', lastName: '', email: '' },
      }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch attendance records');
    }
  }

  async getMyAttendance(): Promise<AttendanceRecord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/my-history`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch attendance');
    }
  }

  async getAllAttendance(): Promise<AttendanceRecord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/all`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch attendance');
    }
  }

  async getEmployeeAttendance(employeeId: number): Promise<AttendanceRecord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/employee/${employeeId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employee attendance');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch employee attendance');
    }
  }

  async setOfficeLocation(location: OfficeLocationDto): Promise<OfficeLocationDto> {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/location`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(location),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set office location');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to set office location');
    }
  }

  // =========== WFH (WORK FROM HOME) ENDPOINTS ===========

  async requestWfh(wfh: RequestWfhDto): Promise<WfhRequest> {
    try {
      const response = await fetch(`${API_BASE_URL}/wfh/request`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          startDate: wfh.startDate,
          endDate: wfh.endDate,
          reason: wfh.reason || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request WFH');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to request WFH');
    }
  }

  async getMyWfhRequests(): Promise<WfhRequest[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/wfh/my`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch WFH requests');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch WFH requests');
    }
  }

  async getAllWfhRequests(): Promise<WfhRequest[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/wfh/all`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch WFH requests');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch WFH requests');
    }
  }

  async approveWfh(requestId: number): Promise<WfhRequest> {
    try {
      const response = await fetch(`${API_BASE_URL}/wfh/${requestId}/approve`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve WFH');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to approve WFH');
    }
  }

  async rejectWfh(requestId: number): Promise<WfhRequest> {
    try {
      const response = await fetch(`${API_BASE_URL}/wfh/${requestId}/reject`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject WFH');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to reject WFH');
    }
  }

  // =========== LEAVE ENDPOINTS ===========

  async applyLeave(leaveDto: CreateLeaveDto): Promise<Leave> {
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/apply`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          leaveTypeId: leaveDto.leaveTypeId,
          startDate: leaveDto.startDate,
          endDate: leaveDto.endDate,
          durationType: leaveDto.durationType || 'FULL_DAY',
          reason: leaveDto.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to apply leave');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to apply leave');
    }
  }

  async approveLeave(leaveId: number): Promise<Leave> {
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/approve/${leaveId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve leave');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to approve leave');
    }
  }

  async rejectLeave(leaveId: number, remarks: string): Promise<Leave> {
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/reject/${leaveId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ remarks }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject leave');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to reject leave');
    }
  }

  async getLeaveHistory(): Promise<Leave[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/history`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave history');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch leave history');
    }
  }

  async getPendingLeaves(): Promise<Leave[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/pending`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending leaves');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch pending leaves');
    }
  }

  async getLeaveBalance(yearStart: number): Promise<LeaveBalance[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/balance?yearStart=${yearStart}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave balance');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch leave balance');
    }
  }

  async getSelfLeaveHistory(): Promise<Leave[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/self/history`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch your leave history');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch your leave history');
    }
  }

  async getSelfLeaveBalance(yearStart: number): Promise<LeaveType[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/self/balance?yearStart=${yearStart}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch your leave balance');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch your leave balance');
    }
  }

  async getMonthlyLeaves(month: number, year: number): Promise<Leave[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/self/monthly?month=${month}&year=${year}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch monthly leaves');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch monthly leaves');
    }
  }

  // =========== HOLIDAYS ENDPOINTS ===========

  async createHoliday(holiday: CreateHolidayDto): Promise<Holiday> {
    try {
      const response = await fetch(`${API_BASE_URL}/holidays`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          name: holiday.name,
          date: holiday.date,
          description: holiday.description,
          isOptional: holiday.isOptional ?? false,
          location: holiday.location,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create holiday');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create holiday');
    }
  }

  async getHolidaysByYear(year: number): Promise<Holiday[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/holidays?year=${year}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch holidays');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch holidays');
    }
  }

  async updateHoliday(id: number, holiday: UpdateHolidayDto): Promise<Holiday> {
    try {
      const response = await fetch(`${API_BASE_URL}/holidays/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(holiday),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update holiday');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update holiday');
    }
  }

  async deleteHoliday(id: number): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/holidays/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete holiday');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete holiday');
    }
  }

  async getMyHolidays(): Promise<Holiday[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/holidays/my`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch your holidays');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch your holidays');
    }
  }

  // =========== EMPLOYEE MANAGEMENT ENDPOINTS ===========

  async createEmployee(employee: CreateEmployeeDto): Promise<CreateEmployeeResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(employee),
      });

      if (!response.ok) {
        throw new Error('Failed to create employee');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create employee');
    }
  }

  async getAllEmployees(): Promise<any[]> {
    try {
      const headers = this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/employees`, { method: 'GET', headers });

      if (!response.ok) {
        throw new Error('Failed to fetch employees from API endpoint');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch employees');
    }
  }

  // =========== HRMS / Documents Endpoints (match backend /hrms/* routes) ===========

  async getRequiredDocuments(employeeId: number): Promise<any[]> {
    try {
      const url = `${API_BASE_URL}/hrms/required/${employeeId}`;
      let response = await fetch(url, { method: 'GET', headers: this.getAuthHeaders() });
      if (response.status === 404 && API_BASE_URL.includes('/api')) {
        const altBase = API_BASE_URL.replace(/\/api\/?$/, '');
        const altUrl = `${altBase}/hrms/required/${employeeId}`;
        response = await fetch(altUrl, { method: 'GET', headers: this.getAuthHeaders() });
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        let msg = `Failed to fetch required documents (${response.status})`;
        try {
          const parsed = JSON.parse(body || '{}');
          msg = parsed.message || msg;
        } catch (e) {
          if (body) msg = `${msg}: ${body}`;
        }
        throw new Error(msg);
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch required documents');
    }
  }

  async uploadDocuments(employeeId: number, documentTypeIds: (number | string)[], files: File[]): Promise<any> {
    try {
      if (!files || files.length === 0) throw new Error('No files provided');

      const form = new FormData();
      form.append('employeeId', String(employeeId));
      // send documentTypeIds as repeated field 'documentTypeIds'
      documentTypeIds.forEach((id) => form.append('documentTypeIds', String(id)));
      files.forEach((f) => form.append('files', f));

      const token = localStorage.getItem('accessToken');

      const url = `${API_BASE_URL}/hrms/upload-multiple`;
      let response = await fetch(url, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      });

      if (response.status === 404 && API_BASE_URL.includes('/api')) {
        const altBase = API_BASE_URL.replace(/\/api\/?$/, '');
        const altUrl = `${altBase}/hrms/upload-multiple`;
        response = await fetch(altUrl, {
          method: 'POST',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: form,
        });
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        let err = `Upload failed (${response.status})`;
        try {
          const parsed = JSON.parse(body || '{}');
          err = parsed.message || err;
        } catch (e) {
          if (body) err = `${err}: ${body}`;
        }
        throw new Error(err);
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to upload documents');
    }
  }

  async getDocuments(employeeId?: number, role?: string): Promise<any[]> {
    try {
      const q = employeeId ? `?employeeId=${employeeId}${role ? `&role=${role}` : ''}` : role ? `?role=${role}` : '';
      const url = `${API_BASE_URL}/hrms/documents${q}`;
      console.log('getDocuments request to:', url);
      let response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      // If the backend is not mounted under `/api` but API_BASE_URL contains `/api`,
      // try a fallback without the `/api` prefix when we get 404.
      if (response.status === 404 && API_BASE_URL.includes('/api')) {
        const altBase = API_BASE_URL.replace(/\/api\/?$/, '');
        const altUrl = `${altBase}/hrms/documents${q}`;
        response = await fetch(altUrl, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        let msg = `Failed to fetch documents (${response.status})`;
        try {
          const parsed = JSON.parse(body || '{}');
          msg = parsed.message || msg;
        } catch (e) {
          if (body) msg = `${msg}: ${body}`;
        }
        throw new Error(msg);
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch documents');
    }
  }

  async updateDocumentStatus(documentId: number, status: string, role: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/hrms/document-status/${documentId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status, role }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update document status');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update document status');
    }
  }

  async approveAllDocuments(employeeId: number, role: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/hrms/approve-all/${employeeId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to approve documents');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to approve documents');
    }
  }

  async downloadDocumentFile(documentId: number): Promise<{ blob: Blob; fileName?: string; mimeType?: string }> {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/hrms/file/${documentId}`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(err || 'Failed to download file');
      }

      const contentDisposition = response.headers.get('content-disposition');
      let fileName: string | undefined;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^\"]+)"?/);
        if (match) fileName = match[1];
      }

      const mimeType = response.headers.get('content-type') || undefined;
      const blob = await response.blob();

      return { blob, fileName, mimeType };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to download file');
    }
  }

  async downloadPayslip(payrollId: number): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/payroll/payslip/${payrollId}`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(err || 'Failed to download payslip');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payrollId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to download payslip');
    }
  }

  async getMyEmployeeDetails(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/me`, { method: 'GET', headers: this.getAuthHeaders() });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch current user details`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch current user details');
    }
  }

  async getEmployeeById(id: number | string): Promise<any> {
    // First, try current user endpoint to ensure full _salaries_ and _payrolls_ fields for self queries
    try {
      const meResponse = await fetch(`${API_BASE_URL}/employees/me`, { method: 'GET', headers: this.getAuthHeaders() });
      if (meResponse.ok) {
        const meEmployee = await meResponse.json();
        if (String(meEmployee.id) === String(id) || String(meEmployee.employeeId) === String(id) || String(meEmployee.userId) === String(id) || String(meEmployee.user?.id) === String(id)) {
          return meEmployee;
        }
      }
    } catch {
      // continue to next lookup
    }

    // Then try direct employee by id
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${id}`, { method: 'GET', headers: this.getAuthHeaders() });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // continue
    }

    // Third fallback: self endpoint if direct id path didn't succeed but we may be cross-user
    try {
      const response = await fetch(`${API_BASE_URL}/employees/me`, { method: 'GET', headers: this.getAuthHeaders() });
      if (response.ok) {
        const meEmployee = await response.json();
        if (String(meEmployee.id) === String(id) || String(meEmployee.employeeId) === String(id) || String(meEmployee.userId) === String(id) || String(meEmployee.user?.id) === String(id)) {
          return meEmployee;
        }
      }
    } catch {
      // continue
    }

    // Fallback: Use getAllEmployees if user has permission (requires ADMIN/HR/MANAGER)
    try {
      const list = await this.getAllEmployees();
      const found = list.find((e: any) => String(e.id) === String(id) || String(e.userId) === String(id) || String(e.user?.id) === String(id));
      if (found) return found;
    } catch (err) {
      // If getAllEmployees fails (403 Forbidden or other error), continue to error
    }

    throw new Error(`Employee with ID ${id} not found`);
  }

  async updateEmployee(employeeId: number, employee: Partial<CreateEmployeeDto>): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(employee),
      });

      if (!response.ok) {
        throw new Error('Failed to update employee');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update employee');
    }
  }

  async findByEmpCode(empCode: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/find/${empCode}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to find employee by code');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to find employee by code');
    }
  }

  async getEmployeeIdByUserId(): Promise<{ employeeId: number }> {
    // Primary approach: Try dedicated endpoints first (no role restrictions)
    const tryUrls = [
      `${API_BASE_URL}/employees/me`,
      `${API_BASE_URL}/employees/info/id`,
    ];

    for (const url of tryUrls) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          // Handle both response formats
          if ('employeeId' in data) {
            return { employeeId: data.employeeId };
          }
          if ('id' in data) {
            return { employeeId: data.id };
          }
        }
      } catch (err) {
        // try next
      }
    }

    // Fallback: Use getAllEmployees and search for current user (requires ADMIN/HR/MANAGER role)
    try {
      const list = await this.getAllEmployees();
      if (list && list.length > 0) {
        const employee = list[0];
        if (employee.id) {
          return { employeeId: employee.id };
        }
      }
    } catch (err) {
      // continue - getAllEmployees may return 403 for non-admin users
    }

    throw new Error('Failed to get employee ID');
  }

  // =========== ASSETS ENDPOINTS ===========

  async createAsset(asset: CreateAssetDto): Promise<Asset> {
    try {
      const response = await fetch(`${API_BASE_URL}/assets`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(asset),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create asset');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create asset');
    }
  }

  async getAllAssets(): Promise<Asset[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/assets`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch assets');
    }
  }

  async assignAsset(assignment: AssignAssetDto): Promise<AssetAssignment> {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/assign`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(assignment),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign asset');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to assign asset');
    }
  }

  async returnAsset(assetId: number): Promise<Asset> {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/return/${assetId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to return asset');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to return asset');
    }
  }

  // =========== PAYROLL ENDPOINTS ===========

  async runPayroll(data: RunPayrollDto): Promise<Payroll> {
    try {
      const response = await fetch(`${API_BASE_URL}/payroll/run`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to run payroll');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to run payroll');
    }
  }

  async addPayrollAdjustment(
    payrollId: number,
    name: string,
    type: 'ALLOWANCE' | 'DEDUCTION',
    amount: number
  ): Promise<PayrollAdjustment> {
    try {
      const response = await fetch(`${API_BASE_URL}/payroll/others`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ payrollId, name, type, amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add payroll adjustment');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add payroll adjustment');
    }
  }

  async getPayroll(employeeId: number): Promise<Payroll[]> {
    if (!employeeId || employeeId <= 0) {
      return [];
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/payroll?employeeId=${employeeId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // Log the error but return empty array for 404 or server errors
        if (response.status === 404 || response.status === 500 || response.status === 400) {
          console.warn(`Payroll endpoint returned ${response.status} for employee ${employeeId}`);
          return [];
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch payroll`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Error fetching payroll for employee ${employeeId}:`, error);
      return [];
    }
  }

  // =========== SALARY ENDPOINTS ===========

  async assignSalary(data: AssignSalaryDto): Promise<EmployeeSalary> {
    try {
      const response = await fetch(`${API_BASE_URL}/salary/assign`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to assign salary';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
          console.error('Backend error response:', errorData);
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to assign salary');
    }
  }

  async getEmployeeSalaries(employeeId: number): Promise<EmployeeSalary[]> {
    if (!employeeId || employeeId <= 0) {
      return [];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/salary/employee/${employeeId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if ([400, 403, 404, 500].includes(response.status)) {
          console.warn(`Salary endpoint returned ${response.status} for employee ${employeeId} (likely insufficient permissions)`);
          return [];
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch employee salaries`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Error fetching employee salaries for ${employeeId}:`, error);
      return [];
    }
  }

  async getEmployeeSalariesByCode(empCode: string): Promise<EmployeeSalary[]> {
    if (!empCode || !empCode.trim()) {
      return [];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/salary/employee/code/${encodeURIComponent(empCode)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if ([400, 403, 404, 500].includes(response.status)) {
          console.warn(`Salary endpoint returned ${response.status} for empCode ${empCode} (likely insufficient permissions)`);
          return [];
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch salaries by empCode`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Error fetching employee salaries by code ${empCode}:`, error);
      return [];
    }
  }

  async getAllSalaries(): Promise<EmployeeSalary[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/salary/all`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if ([400, 403, 404, 500].includes(response.status)) {
          console.warn(`Salary endpoint returned ${response.status} for all salaries (likely insufficient permissions)`);
          return [];
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch all salaries`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Error fetching all salaries:', error);
      return [];
    }
  }
}

export default ApiService.getInstance();
