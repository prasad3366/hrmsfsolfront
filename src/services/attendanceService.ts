import ApiService, { EmployeeDirectoryResponse } from './api';

const attendanceService = {
  getAttendanceEmployees(searchQuery?: string): Promise<EmployeeDirectoryResponse> {
    return ApiService.getAttendanceEmployees(searchQuery);
  },
};

export default attendanceService;