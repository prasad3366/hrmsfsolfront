// Get API base URL from environment or use default
const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000/api';

console.log('API Base URL:', API_BASE_URL);

export interface LoginResponse {
  message: string;
  role: string;
  dashboard: string;
  accessToken: string;
  refreshToken?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

const getAuthTokens = (payload: any): AuthTokens => {
  const accessToken = payload?.accessToken;
  const refreshToken = payload?.refreshToken;

  if (!accessToken) {
    throw new Error('Login response did not include an access token');
  }

  return { accessToken, refreshToken };
};

export interface EmployeeDirectoryQuery {
  search?: string;
  department?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  sortBy?: 'name' | 'empCode' | 'department' | 'status' | 'dateOfJoining';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface EmployeeDirectoryResponse {
  data: any[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  statistics: {
    total: number;
    active: number;
    newJoiners: number;
    onLeave: number;
    probation: number;
    noticePeriod: number;
  };
}

export const normalizeEmployeeDirectoryResponse = (payload: unknown): EmployeeDirectoryResponse => {
  const envelope = Array.isArray(payload) ? {} : (payload as Partial<EmployeeDirectoryResponse> | null) ?? {};
  return {
    data: Array.isArray(payload) ? payload : Array.isArray(envelope.data) ? envelope.data : [],
    meta: envelope.meta ?? { page: 1, pageSize: 25, total: 0, totalPages: 0 },
    statistics: envelope.statistics ?? { total: 0, active: 0, newJoiners: 0, onLeave: 0, probation: 0, noticePeriod: 0 },
  };
};

export interface Employee360Profile {
  id: number;
  empCode: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  employmentType?: string | null;
  sourceOfHire?: string | null;
  currentExperience?: number | null;
  isExperienced?: boolean | null;
  reportingManager?: string | null;
  status: string;
  dateOfJoining?: string | null;
  phone?: string | null;
  city?: string | null;
  user?: { id: number; email: string; role: string; isActive: boolean };
  team?: {
    id: number;
    name: string;
    manager?: { id: number; firstName: string; lastName: string } | null;
  } | null;
}

export interface Employee360Hierarchy {
  employeeId: number;
  team: { id: number; name: string } | null;
  manager: { employeeId: number; name: string; designation: string } | null;
  reportingRelationship: { type: string; managerEmployeeId: number } | null;
}

export interface Employee360Attendance {
  month: string;
  workingDays: number;
  presentDays: number;
  halfDays: number;
  leaveDays: number;
  absentDays: number;
  presentEquivalentDays: number;
  attendancePercentage: number;
}

export interface Employee360Leave {
  employeeId: number;
  status: string;
  currentLeaveStatus: {
    status: string;
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    totalDays?: number;
  };
  balanceSummary: Array<{
    leaveType: string;
    allocated: number;
    used: number;
    carryForward: number;
    remaining: number;
  }>;
  leaveCounts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  recentHistory: Array<{
    id: number;
    status: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    durationType: string;
  }>;
}

export interface Employee360Document {
  id: number;
  fileName?: string | null;
  mimeType?: string | null;
  documentType?: { name?: string | null } | null;
  documentTypeId?: number | string | null;
  employeeId?: number | null;
  status?: string | null;
  uploadedAt?: string | null;
  verifiedAt?: string | null;
}

export interface Employee360Payroll {
  month: number;
  year: number;
  status: string;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  latestSalaryEffectiveDate?: string | null;
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
    department?: string;
    designation?: string;
  };
  isCurrentUser?: boolean; // Indicates if the record belongs to the current user
}

export interface AttendanceHistoryResponse {
  data: AttendanceRecord[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    month: number;
    year: number;
  };
}

export interface MonthlyAttendanceSummary {
  employeeId: number;
  month: string;
  workingDays: number;
  presentDays: number;
  halfDays: number;
  leaveDays: number;
  absentDays: number;
  presentEquivalentDays: number;
  attendancePercentage: number;
}

export interface TodayAttendanceStatus {
  hasPunchedIn: boolean;
  hasPunchedOut: boolean;
  punchInTime: string | null;
  punchOutTime: string | null;
  locationStatus: string | null;
  totalHours: number;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | null;
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
  role: 'SUPER_ADMIN' | 'CEO' | 'HR' | 'FINANCE_MANAGER' | 'IT_MANAGER' | 'SALES_MANAGER' | 'EMPLOYEE';
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
  description?: string;
  assignedTo?: number;
}

export interface AssignAssetDto {
  assetId: number;
  employeeId: number;
}

export interface AssetAssignment {
  id: number;
  assetId: number;
  assignedTo: number;
  assignedAt: string;
  unassignedAt?: string | null;
  user?: Asset['user'];
}

export interface Asset {
  id: number;
  name: string;
  description?: string;
  assignedTo?: number | null;
  assignedAt?: string | null;
  status: 'AVAILABLE' | 'ASSIGNED' | 'RETURNED';
  returnedAt?: string | null;
  createdAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    employee?: {
      id: number;
      empCode: string;
      department?: string;
      designation?: string;
      [key: string]: any;
    };
  };
}

const normalizeAssetResponse = (payload: unknown): Asset[] => {
  if (Array.isArray(payload)) return payload as Asset[];
  if (!payload || typeof payload !== 'object') return [];

  const envelope = payload as { data?: unknown; assets?: unknown; items?: unknown };
  if (Array.isArray(envelope.data)) return envelope.data as Asset[];
  if (Array.isArray(envelope.assets)) return envelope.assets as Asset[];
  if (Array.isArray(envelope.items)) return envelope.items as Asset[];
  return [];
};

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

export const normalizeWfhResponse = (payload: unknown): WfhRequest[] => {
  if (Array.isArray(payload)) return payload as WfhRequest[];

  if (payload && typeof payload === 'object') {
    const envelope = payload as { data?: unknown; requests?: unknown; results?: unknown; items?: unknown };
    for (const value of [envelope.data, envelope.requests, envelope.results, envelope.items]) {
      if (Array.isArray(value)) return value as WfhRequest[];
      if (value && typeof value === 'object') {
        try {
          return normalizeWfhResponse(value);
        } catch {
          // Check the next supported response envelope.
        }
      }
    }
  }

  throw new Error('Unexpected WFH response format');
};

// Leave Types
export interface CreateLeaveDto {
  leaveTypeId: number;
  startDate: string | Date;
  endDate: string | Date;
  durationType?: 'FULL_DAY' | 'HALF_DAY' | 'HALF_DAY_FIRST' | 'HALF_DAY_SECOND';
  reason: string;
  medicalCertificate?: string | null; // Base64 encoded file or file URL
  medicalCertificateFileName?: string;
  isEmergency?: boolean;
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  remarks?: string;
  yearStart: number;
  medicalCertificate?: string | null;
  medicalCertificateFileName?: string;
  isEmergency?: boolean;
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

export interface LeaveHistoryResponse {
  data: Leave[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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
  id: number;
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
  conveyance?: number;
  specialAllowance?: number;
  pf: number;
  pt: number;
  leaveDeduction?: number;
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
  structure?: { id?: number; name?: string } | null;
  annualCTC: number;
  monthlyCTC: number;
  effectiveFrom: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryStructure {
  id: number;
  name: string;
  basicPercent: number;
  hraPercent: number;
  conveyancePercent: number;
  pfPercent: number;
  ptAmount: number;
  healthInsurance: number;
  createdAt: string;
}

// =========== TEAM TYPES ===========

export interface TeamMember {
  id?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  empCode?: string;
  designation?: string;
  department?: string;
}

export interface TeamManager {
  id?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  empCode?: string;
}

export interface Team {
  id: number;
  name: string;
  manager?: TeamManager | string;
  members?: TeamMember[];
  membersCount?: number;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTeamDto {
  name: string;
  managerId: string; // empCode of the manager
  employeeIds?: number[];
}

export interface AddMembersDto {
  employeeIds: number[];
}

export type RecruitmentCandidateStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED';

export interface RecruitmentJobPosting {
  id: number;
  title: string;
  department: string;
  requirements: string;
  description: string;
  openings: number;
  remainingOpenings?: number;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
}

export interface CreateRecruitmentJobDto {
  title: string;
  department: string;
  requirements: string;
  description: string;
  openings: number;
}

export type UpdateRecruitmentJobDto = Partial<CreateRecruitmentJobDto>;

export interface RecruitmentInterview {
  id: number;
  scheduledAt: string;
  interviewer: string;
  notes?: string;
  feedback?: string;
}

export interface RecruitmentCandidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  jobPostingId: number;
  jobTitle?: string;
  status: RecruitmentCandidateStatus;
  interviews?: RecruitmentInterview[];
}

export interface CreateRecruitmentCandidateDto {
  name: string;
  email: string;
  phone: string;
  jobPostingId: number;
}

export interface ScheduleRecruitmentInterviewDto {
  candidateId: number;
  scheduledAt: string;
  interviewer: string;
}

export interface RecruitmentInterviewFeedbackDto {
  feedback: string;
}

export type TrainingProgramStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';

export interface TrainingEnrollment {
  id: number;
  employeeId: number;
  employeeName?: string;
  employee?: { id: number; firstName?: string; lastName?: string; name?: string };
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface TrainingProgram {
  id: number;
  title: string;
  description?: string;
  trainer: string;
  department: string;
  startDate: string;
  endDate: string;
  status: TrainingProgramStatus;
  enrolledCount?: number;
  enrollments?: TrainingEnrollment[];
}

export interface CreateTrainingProgramDto {
  title: string;
  description: string;
  trainer: string;
  department: string;
  startDate: string;
  endDate: string;
}

export interface EnrollEmployeesDto {
  trainingProgramId: number;
  employeeIds: number[];
}

export interface UpdateEnrollmentStatusDto {
  status: TrainingEnrollment['status'];
}

export type AnnouncementCategory = 'POLICY' | 'HOLIDAY' | 'GENERAL' | 'EVENT';
export type AnnouncementPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  targetDepartment?: string | null;
  isPinned?: boolean;
  expiresAt?: string | null;
  createdAt?: string;
  isRead?: boolean;
  read?: boolean;
  author?: { name?: string; firstName?: string; lastName?: string };
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  targetDepartment: string;
  isPinned: boolean;
  expiresAt: string;
}

export interface ReportsSummary {
  totalEmployees?: number;
  employees?: number;
  todayAttendancePercentage?: number;
  trainingCompletionRate?: number;
  activeDepartments?: number;
  [key: string]: unknown;
}

export interface HrmsSettings {
  companyName?: string;
  supportEmail?: string;
  hrEmail?: string;
  address?: string;
  timezone?: string;
  currencyCode?: string;
  workDaysPerWeek?: number;
  attendanceGracePeriod?: number;
  [key: string]: unknown;
}

export interface PermissionRecord {
  module: string;
  role: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  [key: string]: unknown;
}

class ApiService {
  private static instance: ApiService;
  private pendingRefresh: Promise<void> | null = null;
  private originalFetch: typeof fetch;
  private retriedRequests = new Map<string, number>();

  private constructor() {
    this.originalFetch = globalThis.fetch.bind(globalThis);
    (globalThis as any).__apiServiceOriginalFetch ??= this.originalFetch;
    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      return this.fetchWithAutoRefresh(input, init ?? {});
    }) as typeof fetch;
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private getToken(): string | null {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  }

  private getAuthorizationHeaders(): HeadersInit {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...this.getAuthorizationHeaders(),
    };
  }

  async post<T>(path: string, payload: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const error = new Error(errorData?.message || `Request failed with status ${response.status}`) as Error & {
        response?: { data?: unknown };
      };
      error.response = { data: errorData };
      throw error;
    }

    return await response.json() as T;
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    return await response.json() as T;
  }

  async patch<T>(path: string, payload: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    return await response.json() as T;
  }

  async delete<T = void>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  }

  private clearAuthTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  private withFreshAuthHeaders(headers?: HeadersInit): HeadersInit {
    const merged = new Headers(headers ?? {});
    const authHeaders = new Headers(this.getAuthorizationHeaders());

    for (const [key, value] of authHeaders.entries()) {
      merged.set(key, value);
    }

    return merged;
  }

  private withAuthHeaderIfNeeded(url: string, init: RequestInit): RequestInit {
    if (url.includes('/auth/login') || url.includes('/auth/forgot-password')) {
      return init;
    }

    const token = this.getToken();
    if (!token) {
      return init;
    }

    const headers = new Headers(init.headers ?? {});
    headers.set('Authorization', `Bearer ${token}`);
    return { ...init, headers };
  }

  private getRequestRetryKey(input: RequestInfo | URL, init?: RequestInit): string {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET')).toUpperCase();
    const body = typeof init?.body === 'string' ? init.body : '';
    return `${method}|${url}|${body}`;
  }

  private async performRefresh(): Promise<void> {
    const refreshTokenValue = localStorage.getItem('refreshToken');

    if (!refreshTokenValue) {
      this.clearAuthTokens();
      throw new Error('No refresh token available');
    }

    try {
      const response = await (globalThis as any).__apiServiceOriginalFetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        this.clearAuthTokens();
        throw new Error('Token refresh failed');
      }

      const tokens = getAuthTokens(await response.json());
      localStorage.setItem('accessToken', tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }
    } catch (error) {
      this.clearAuthTokens();
      throw error instanceof Error ? error : new Error('Token refresh failed');
    }
  }

  private async fetchWithAutoRefresh(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes('/auth/refresh')) {
      return this.originalFetch(input, init);
    }

    const retryKey = this.getRequestRetryKey(input, init);
    const hasRetried = (this.retriedRequests.get(retryKey) ?? 0) >= 1;

    if (hasRetried) {
      return this.originalFetch(input, init);
    }

    const response = await this.originalFetch(input, this.withAuthHeaderIfNeeded(url, init));

    if (response.status !== 401) {
      this.retriedRequests.delete(retryKey);
      return response;
    }

    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) {
      return response;
    }

    const refreshPromise = this.pendingRefresh ?? this.performRefresh();
    this.pendingRefresh ??= refreshPromise;

    try {
      await refreshPromise;
    } catch {
      this.retriedRequests.delete(retryKey);
      return response;
    } finally {
      if (this.pendingRefresh === refreshPromise) {
        this.pendingRefresh = null;
      }
    }

    this.retriedRequests.set(retryKey, (this.retriedRequests.get(retryKey) ?? 0) + 1);

    const retryOptions: RequestInit = {
      ...init,
      headers: this.withFreshAuthHeaders(init.headers),
      body: init.body,
    };

    return this.originalFetch(input, retryOptions);
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const url = `${API_BASE_URL}/auth/login`;
      console.log('Login request to:', url);
      console.log('Payload:', { email, password: '[REDACTED]' });

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
      const tokens = getAuthTokens(data);
      
      // Store tokens
      localStorage.setItem('accessToken', tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }
      
      return { ...data, ...tokens };
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

      const tokens = getAuthTokens(await response.json());
      
      // Update tokens
      localStorage.setItem('accessToken', tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }
      
      return tokens;
    } catch {
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
    } catch {
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

  async getMyAttendance(
    month: number,
    year: number,
    page = 1,
    pageSize = 10,
  ): Promise<AttendanceHistoryResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/attendance/my-history?month=${month}&year=${year}&page=${page}&pageSize=${pageSize}`,
        {
        method: 'GET',
        headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }

      const payload = await response.json();
      const normalizeRecord = (record: any): AttendanceRecord => {
        const normalized = { ...record };
        if (record.punchIn === undefined && record.clockIn !== undefined) {
          normalized.punchIn = record.clockIn;
        }
        if (record.punchOut === undefined && record.clockOut !== undefined) {
          normalized.punchOut = record.clockOut;
        }
        return normalized;
      };
      if (Array.isArray(payload)) {
        return {
          data: payload.map(normalizeRecord),
          meta: {
            page,
            pageSize,
            total: payload.length,
            totalPages: payload.length > 0 ? 1 : 0,
            month,
            year,
          },
        };
      }

      return {
        ...payload,
        data: Array.isArray(payload.data) ? payload.data.map(normalizeRecord) : [],
      } as AttendanceHistoryResponse;
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

  async getEmployeeAttendance(
    employeeId: number,
    month?: number,
    year?: number,
    status?: string,
  ): Promise<AttendanceRecord[]> {
    try {
      const params = new URLSearchParams();
      if (month !== undefined) params.set('month', String(month));
      if (year !== undefined) params.set('year', String(year));
      if (status) params.set('status', status);
      const query = params.toString();
      const response = await fetch(
        `${API_BASE_URL}/attendance/employee/${employeeId}/monthly${query ? `?${query}` : ''}`,
        {
        method: 'GET',
        headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch employee attendance');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch employee attendance');
    }
  }

  async getEmployeeAttendanceSummary(
    employeeId: number,
    month: string,
  ): Promise<MonthlyAttendanceSummary> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/attendance/employee/${employeeId}/summary?month=${encodeURIComponent(month)}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch attendance summary');
      }

      const result = await response.json();
      if (
        !result ||
        typeof result !== 'object' ||
        result.employeeId !== employeeId ||
        result.month !== month
      ) {
        throw new Error('Invalid attendance summary response');
      }

      return result as MonthlyAttendanceSummary;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch attendance summary');
    }
  }

  async getTodayStatus(): Promise<TodayAttendanceStatus | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/today-status`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch today attendance status');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch today attendance status');
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

      return normalizeWfhResponse(await response.json());
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch WFH requests');
    }
  }

  async getAllWfhRequests(): Promise<WfhRequest[]> {
    const endpoints = ['/wfh/all', '/wfh/requests'];
    let lastError: Error | null = null;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });
        if (!response.ok) {
          lastError = new Error(`WFH endpoint returned ${response.status}`);
          continue;
        }
        return normalizeWfhResponse(await response.json());
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Failed to fetch WFH requests');
      }
    }
    throw new Error('Failed to fetch WFH requests');
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
          medicalCertificate: leaveDto.medicalCertificate || null,
          medicalCertificateFileName: leaveDto.medicalCertificateFileName || null,
          isEmergency: leaveDto.isEmergency || false,
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

  async getLeaveHistory(page = 1, limit = 10): Promise<LeaveHistoryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/history?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave history');
      }

      const result = await response.json();
      if (!result || !Array.isArray(result.data) || !result.pagination) {
        throw new Error('Invalid leave history response');
      }

      return result as LeaveHistoryResponse;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch leave history');
    }
  }

  async getPaginatedLeaveHistory(page = 1, limit = 10): Promise<LeaveHistoryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/history?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch paginated leave history');
      }

      const result = await response.json();
      if (!result || !Array.isArray(result.data) || !result.pagination) {
        throw new Error('Invalid paginated leave history response');
      }

      return result as LeaveHistoryResponse;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch paginated leave history');
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

      const result = await response.json();
      if (!Array.isArray(result)) {
        throw new Error('Invalid pending leaves response');
      }

      return result as Leave[];
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

  async getAllEmployees(query?: EmployeeDirectoryQuery): Promise<any> {
    try {
      const headers = this.getAuthHeaders();
      const params = new URLSearchParams();
      Object.entries(query ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.set(key, String(value));
      });
      const queryString = params.toString();
      const response = await fetch(`${API_BASE_URL}/employees${queryString ? `?${queryString}` : ''}`, { method: 'GET', headers });

      if (!response.ok) {
        throw new Error('Failed to fetch employees from API endpoint');
      }

      return normalizeEmployeeDirectoryResponse(await response.json());
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch employees');
    }
  }

  async getAttendanceEmployees(searchQuery?: string): Promise<EmployeeDirectoryResponse> {
    const search = searchQuery?.trim();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const attendanceEmployeesEndpoint = `${API_BASE_URL}/attendance/employees`;

    try {
      const response = await fetch(`${attendanceEmployeesEndpoint}${params.toString() ? `?${params.toString()}` : ''}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch employees from API endpoint');
      return normalizeEmployeeDirectoryResponse(await response.json());
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch employees');
    }
  }

  private async getEmployee360Resource<T>(
    employeeId: number,
    path: string,
    errorMessage: string,
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/360${path}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) throw new Error(errorMessage);
      return await response.json() as T;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : errorMessage);
    }
  }

  async getJobs(): Promise<RecruitmentJobPosting[]> {
    const response = await fetch(`${API_BASE_URL}/recruitment/jobs`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch job postings');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async createJob(data: CreateRecruitmentJobDto): Promise<RecruitmentJobPosting> {
    return this.post<RecruitmentJobPosting>('/recruitment/jobs', data);
  }

  async deleteJob(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/recruitment/jobs/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete job posting');
  }

  async updateJob(id: number, data: UpdateRecruitmentJobDto): Promise<RecruitmentJobPosting> {
    const response = await fetch(`${API_BASE_URL}/recruitment/jobs/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update job posting');
    return await response.json();
  }

  async getCandidates(jobPostingId?: number): Promise<RecruitmentCandidate[]> {
    const query = jobPostingId == null ? '' : `?jobPostingId=${jobPostingId}`;
    const response = await fetch(`${API_BASE_URL}/recruitment/candidates${query}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch candidates');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async createCandidate(data: CreateRecruitmentCandidateDto): Promise<RecruitmentCandidate> {
    const response = await fetch(`${API_BASE_URL}/recruitment/candidates`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create candidate');
    return await response.json();
  }

  async deleteCandidate(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/recruitment/candidates/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete candidate');
  }

  async updateCandidateStatus(id: number, status: RecruitmentCandidateStatus): Promise<RecruitmentCandidate> {
    const response = await fetch(`${API_BASE_URL}/recruitment/candidates/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update candidate status');
    return await response.json();
  }

  async scheduleInterview(data: ScheduleRecruitmentInterviewDto): Promise<RecruitmentInterview> {
    const response = await fetch(`${API_BASE_URL}/recruitment/interviews`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to schedule interview');
    return await response.json();
  }

  async submitInterviewFeedback(id: number, data: RecruitmentInterviewFeedbackDto): Promise<RecruitmentInterview> {
    const response = await fetch(`${API_BASE_URL}/recruitment/interviews/${id}/feedback`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to submit interview feedback');
    return await response.json();
  }

  async getTrainingPrograms(): Promise<TrainingProgram[]> {
    const response = await fetch(`${API_BASE_URL}/training/programs`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch training programs');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async createTrainingProgram(data: CreateTrainingProgramDto): Promise<TrainingProgram> {
    return this.post<TrainingProgram>('/training/programs', data);
  }

  async updateTrainingProgram(id: number, data: Partial<CreateTrainingProgramDto>): Promise<TrainingProgram> {
    const response = await fetch(`${API_BASE_URL}/training/programs/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update training program');
    return await response.json();
  }

  async deleteTrainingProgram(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/training/programs/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete training program');
  }

  async enrollEmployees(data: EnrollEmployeesDto): Promise<TrainingEnrollment[]> {
    return this.post<TrainingEnrollment[]>('/training/enroll', data);
  }

  async updateEnrollmentStatus(id: number, data: UpdateEnrollmentStatusDto): Promise<TrainingEnrollment> {
    const response = await fetch(`${API_BASE_URL}/training/enrollments/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update enrollment status');
    return await response.json();
  }

  async getAnnouncements(): Promise<Announcement[]> {
    const response = await fetch(`${API_BASE_URL}/announcements/feed`, { method: 'GET', headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch announcements');
    const payload = await response.json();
    const data = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.announcements)
          ? payload.announcements
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

    return data.map((announcement: any) => ({
      ...announcement,
      category: String(announcement?.category || 'GENERAL').toUpperCase() as AnnouncementCategory,
      isPinned: announcement?.isPinned === true
        || String(announcement?.isPinned || announcement?.pinStatus || '').toUpperCase() === 'PINNED',
    }));
  }

  async getReportsSummary(): Promise<ReportsSummary> {
    const response = await fetch(`${API_BASE_URL}/reports/summary`, { method: 'GET', headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch reports summary');
    const data = await response.json();
    return data && typeof data === 'object' ? data : {};
  }

  async exportEmployeeReport(): Promise<Record<string, unknown>[]> {
    const response = await fetch(`${API_BASE_URL}/reports/export/employees`, { method: 'GET', headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to export employee report');
    const data = await response.json();
    return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  }

  async exportAttendanceReport(): Promise<Record<string, unknown>[]> {
    const response = await fetch(`${API_BASE_URL}/reports/export/attendance`, { method: 'GET', headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to export attendance report');
    const data = await response.json();
    return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  }

  async exportTrainingReport(): Promise<Record<string, unknown>[]> {
    const response = await fetch(`${API_BASE_URL}/reports/export/training`, { method: 'GET', headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to export training report');
    const data = await response.json();
    return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  }

  async getSettings(): Promise<HrmsSettings> {
    const response = await fetch(`${API_BASE_URL}/settings`, { method: 'GET', headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch settings');
    const data = await response.json();
    return data && typeof data === 'object' ? (data.data && typeof data.data === 'object' ? data.data : data) : {};
  }

  async updateSettings(data: HrmsSettings): Promise<HrmsSettings> {
    const response = await fetch(`${API_BASE_URL}/settings`, { method: 'PATCH', headers: this.getAuthHeaders(), body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Failed to update settings');
    return await response.json();
  }

  async getPermissions(): Promise<PermissionRecord[]> {
    const response = await fetch(`${API_BASE_URL}/settings/permissions`, { method: 'GET', headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch permissions');
    const data = await response.json();
    return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.permissions) ? data.permissions : [];
  }

  async updatePermission(data: PermissionRecord): Promise<PermissionRecord> {
    const response = await fetch(`${API_BASE_URL}/settings/permissions`, { method: 'PATCH', headers: this.getAuthHeaders(), body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Failed to update permission');
    return await response.json();
  }

  async createAnnouncement(data: CreateAnnouncementDto): Promise<Announcement> {
    return this.post<Announcement>('/announcements', data);
  }

  async updateAnnouncement(id: number, data: CreateAnnouncementDto): Promise<Announcement> {
    const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update announcement');
    return await response.json();
  }

  async deleteAnnouncement(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete announcement');
  }

  async markAnnouncementAsRead(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/announcements/${id}/read`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error('Failed to mark announcement as read');
  }

  async getEmployee360(employeeId: number): Promise<Employee360Profile> {
    return this.getEmployee360Resource<Employee360Profile>(employeeId, '', 'Failed to fetch employee 360 profile');
  }

  async getEmployee360Attendance(employeeId: number, month: string): Promise<Employee360Attendance> {
    return this.getEmployee360Resource<Employee360Attendance>(
      employeeId,
      `/attendance?month=${encodeURIComponent(month)}`,
      'Failed to fetch employee 360 attendance',
    );
  }

  async getEmployee360Leave(employeeId: number): Promise<Employee360Leave> {
    return this.getEmployee360Resource<Employee360Leave>(employeeId, '/leave', 'Failed to fetch employee 360 leave');
  }

  async getEmployee360Hierarchy(employeeId: number): Promise<Employee360Hierarchy> {
    return this.getEmployee360Resource<Employee360Hierarchy>(employeeId, '/hierarchy', 'Failed to fetch employee 360 hierarchy');
  }

  async getEmployee360Assets(employeeId: number): Promise<Asset[]> {
    return this.getEmployee360Resource<Asset[]>(employeeId, '/assets', 'Failed to fetch employee 360 assets');
  }

  async getEmployee360Documents(employeeId: number): Promise<Employee360Document[]> {
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/360/documents`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch employee 360 documents');
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload : payload?.data || payload?.documents || [];
  }

  async getEmployee360Payroll(employeeId: number): Promise<Employee360Payroll[]> {
    return this.getEmployee360Resource<Employee360Payroll[]>(employeeId, '/payroll', 'Failed to fetch employee 360 payroll');
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
        } catch {
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

      const url = `${API_BASE_URL}/hrms/upload-multiple`;
      let response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthorizationHeaders(),
        body: form,
      });

      if (response.status === 404 && API_BASE_URL.includes('/api')) {
        const altBase = API_BASE_URL.replace(/\/api\/?$/, '');
        const altUrl = `${altBase}/hrms/upload-multiple`;
        response = await fetch(altUrl, {
          method: 'POST',
          headers: this.getAuthorizationHeaders(),
          body: form,
        });
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        let err = `Upload failed (${response.status})`;
        try {
          const parsed = JSON.parse(body || '{}');
          err = parsed.message || err;
        } catch {
          if (body) err = `${err}: ${body}`;
        }
        throw new Error(err);
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to upload documents');
    }
  }

  private buildDocumentsQueryString(employeeId?: number, role?: string): string {
    if (employeeId && role) {
      return `?employeeId=${employeeId}&role=${role}`;
    }
    if (employeeId) {
      return `?employeeId=${employeeId}`;
    }
    if (role) {
      return `?role=${role}`;
    }
    return '';
  }

  private async fetchWithFallback(url: string, altUrl: string, options: RequestInit): Promise<Response> {
    let response = await fetch(url, options);
    if (response.status === 404 && API_BASE_URL.includes('/api')) {
      response = await fetch(altUrl, options);
    }
    return response;
  }

  private parseErrorResponse(body: string): string {
    try {
      const parsed = JSON.parse(body || '{}');
      return parsed.message || 'Unknown error';
    } catch (error) {
      console.debug('Failed to parse error response', error);
      return body || 'Unknown error';
    }
  }

  async getDocuments(employeeId?: number, role?: string): Promise<any[]> {
    try {
      const q = this.buildDocumentsQueryString(employeeId, role);
      const url = `${API_BASE_URL}/hrms/documents${q}`;
      const altUrl = `${API_BASE_URL.replace(/\/api\/?$/, '')}/hrms/documents${q}`;

      console.log('getDocuments request to:', url);
      const response = await this.fetchWithFallback(url, altUrl, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        const msg = `Failed to fetch documents (${response.status}): ${this.parseErrorResponse(body)}`;
        throw new Error(msg);
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch documents');
    }
  }

  async updateDocumentStatus(
    documentId: number,
    status: string,
    role: string,
    rejectionReason?: string,
  ): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/hrms/document-status/${documentId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          status,
          role,
          ...(rejectionReason !== undefined ? { remarks: rejectionReason } : {}),
        }),
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
        const match = /filename="?([^"]+)"?/.exec(contentDisposition);
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
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payrollId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to download payslip');
    }
  }

  /** Manual "Generate Payslip" action for HR/Admin/Manager - runs payroll
   * for the given employee/period if it hasn't been run yet, then downloads
   * the payslip PDF directly. */
  async generatePayslip(data: RunPayrollDto): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/payroll/generate-payslip`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(err || 'Failed to generate payslip');
      }
      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${data.month}-${data.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to generate payslip');
    }
  }

  /** HR/Admin/Manager quick action - downloads the attendance CSV report
   * (employee code, name, total days in month, present days, leave days)
   * for the given month/year. Managers only receive their own team's rows,
   * enforced server-side. */
  async exportAttendance(month: number, year: number): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_BASE_URL}/dashboard/export-attendance?month=${month}&year=${year}`,
        {
          method: 'GET',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        },
      );
      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(err || 'Failed to export attendance report');
      }
      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${year}-${String(month).padStart(2, '0')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to export attendance report');
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
    } catch (error) {
      console.debug('Failed first employee lookup by user/me', error);
    }

    // Then try direct employee by id
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${id}`, { method: 'GET', headers: this.getAuthHeaders() });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.debug('Failed direct employee lookup by id', error);
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
    } catch (error) {
      console.debug('Failed employee fallback (employees/me)', error);
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

  private async tryEmployeeIdUrl(url: string): Promise<number | null> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) return null;

      const data = await response.json();
      if ('employeeId' in data) return data.employeeId;
      if ('id' in data) return data.id;
      
      return null;
    } catch (error) {
      console.debug('Failed employee ID URL fetch', error);
      return null;
    }
  }

  async getEmployeeIdByUserId(): Promise<{ employeeId: number }> {
    const urls = [
      `${API_BASE_URL}/employees/me`,
      `${API_BASE_URL}/employees/info/id`,
    ];

    for (const url of urls) {
      const employeeId = await this.tryEmployeeIdUrl(url);
      if (employeeId) return { employeeId };
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

      return normalizeAssetResponse(await response.json());
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch assets');
    }
  }

  async getMyAssets(): Promise<Asset[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/my-assets`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch my assets');
      }

      return normalizeAssetResponse(await response.json());
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch my assets');
    }
  }

  async getMyAssetsByUserId(_userId: number): Promise<Asset[]> {
    try {
      return await this.getMyAssets();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch assets for user');
    }
  }

  async assignAsset(assignment: AssignAssetDto): Promise<Asset> {
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

  async updateAsset(assetId: number, data: { name: string; description?: string }): Promise<Asset> {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update asset');
    }
    return await response.json();
  }

  async getAssetHistory(assetId: number): Promise<AssetAssignment[]> {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}/history`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch asset history');
    }
    const payload = await response.json();
    return Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
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

  /** Fetches the logged-in user's own payroll history. Unlike getPayroll(),
   * this needs no ADMIN/HR/MANAGER role - the server resolves the employee
   * from the auth token. */
  async getMyPayroll(): Promise<Payroll[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/payroll/my`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.warn(`Payroll/my endpoint returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Error fetching own payroll:', error);
      return [];
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
        } catch (error) {
          console.debug('Failed to parse assign salary error response', error);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to assign salary');
    }
  }

  async getUnassignedEmployees(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/salary/unassigned-employees`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch unassigned employees');

      const payload = await response.json();
      const employees = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.employees)
            ? payload.employees
            : [];
      console.log('Unassigned employees response:', employees);
      return employees;
    } catch (error) {
      console.error('Failed to fetch unassigned employees:', error);
      return [];
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
      console.log('Salary Assignment Response:', data);
      const salaryRecords = Array.isArray(data)
        ? data
        : data?.annualCTC || data?.annualCtc || data?.ctc || data?.id
          ? [data]
          : Array.isArray(data?.data)
            ? data.data
            : data?.data?.salary
              ? [data.data.salary]
              : data?.salary
                ? [data.salary]
                : data?.assignment
                  ? [data.assignment]
                  : [];

      return salaryRecords.map((salary: any) => ({
        ...salary,
        annualCTC: salary?.annualCTC ?? salary?.annualCtc ?? salary?.ctc ?? 0,
        monthlyCTC: salary?.monthlyCTC ?? salary?.monthlyCtc ?? salary?.monthlySalary ?? 0,
        structureId: salary?.structureId ?? salary?.structure?.id ?? 0,
        effectiveFrom: salary?.effectiveFrom ?? salary?.effectiveDate ?? salary?.createdAt ?? '',
      }));
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

  async getSalaryStructures(): Promise<SalaryStructure[]> {
    // Try multiple endpoint variations silently
    const endpoints = [
      `${API_BASE_URL}/salary/structures`,
      `${API_BASE_URL}/salary-structures`,
      `${API_BASE_URL}/payroll/structures`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        }
      } catch (error) {
        console.debug('Failed to fetch team data from endpoint', error);
      }
    }

    // All endpoints failed or returned non-ok, return empty array
    // Frontend will use default structure fallback
    return [];
  }


  async createSalaryStructure(structure: Omit<SalaryStructure, 'id' | 'createdAt'>): Promise<SalaryStructure> {
    try {
      const response = await fetch(`${API_BASE_URL}/salary/structures`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(structure),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create salary structure');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create salary structure');
    }
  }

  // =========== TEAM ENDPOINTS ===========

  async createTeam(team: CreateTeamDto): Promise<Team> {
    try {
      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(team),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create team' }));
        throw new Error(error.message || 'Failed to create team');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create team');
    }
  }

  async addMembers(teamId: number, members: AddMembersDto): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(members),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to add members' }));
        throw new Error(error.message || 'Failed to add members');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add members');
    }
  }

  async getAllTeams(): Promise<Team[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch teams' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch teams');
    }
  }

  async removeTeamMember(teamId: number | string, employeeId: number): Promise<{ message: string }> {
    try {
      const id = typeof teamId === 'string' && teamId.includes(':') 
        ? teamId.split(':')[0] 
        : teamId.toString();
      const response = await fetch(`${API_BASE_URL}/teams/${id}/members/${employeeId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to remove member' }));
        throw new Error(error.message || 'Failed to remove member');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to remove member');
    }
  }

  async deleteTeam(teamId: number | string): Promise<{ message: string }> {
    try {
      const id = typeof teamId === 'string' && teamId.includes(':') 
        ? teamId.split(':')[0] 
        : teamId.toString();
      const url = `${API_BASE_URL}/teams/${id}`;
      console.log('🗑️ [ApiService.deleteTeam] Deleting team with URL:', url);
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete team' }));
        throw new Error(error.message || 'Failed to delete team');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete team');
    }
  }

  async getMyTeam(): Promise<Team | Team[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/teams/my-team`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch my team' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      // Handle both array and single object responses for backwards compatibility
      if (Array.isArray(data)) {
        return data;
      }
      return data ? [data] : [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch my team');
    }
  }

  // ================= CARRY FORWARD =================
  async requestCarryForward(
    leaveTypeId: number,
    yearStart: number,
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/leaves/carry-forward`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          leaveTypeId,
          yearStart,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request carry forward');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to request carry forward');
    }
  }

  // ================= HELPDESK TICKETS =================
  async createHelpdeskTicket(data: { issue: string; reason: string }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/helpdesk/tickets`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create helpdesk ticket');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create helpdesk ticket');
    }
  }

  async getHelpdeskTickets(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/helpdesk/tickets`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch helpdesk tickets');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch helpdesk tickets');
    }
  }

  async getMyHelpdeskTickets(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/helpdesk/tickets/my-tickets`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch my helpdesk tickets');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch my helpdesk tickets');
    }
  }

  async approveHelpdeskTicket(ticketId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/helpdesk/tickets/${ticketId}/approve`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve helpdesk ticket');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to approve helpdesk ticket');
    }
  }

  async resolveHelpdeskTicket(ticketId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/helpdesk/tickets/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resolve helpdesk ticket');
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to resolve helpdesk ticket');
    }
  }
}

export default ApiService.getInstance();
