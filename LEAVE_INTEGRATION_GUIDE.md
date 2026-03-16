# Leave Management Integration Guide

## Overview
You now have a fully integrated Leave Management system connecting your React frontend with the NestJS backend. All components communicate with real API endpoints instead of mock data.

---

## ✅ Changes Made

### 1. **API Service Layer** (`src/services/api.ts`)
Added complete Leave management API methods:

- `applyLeave(leaveDto)` - Submit a new leave request
- `approveLeave(leaveId)` - Approve a pending leave request  
- `rejectLeave(leaveId, remarks)` - Reject a leave request with optional remarks
- `getLeaveHistory()` - Fetch all leave requests (role-based)
- `getPendingLeaves()` - Get pending leave requests for approval
- `getLeaveBalance(yearStart)` - Get leave balance for all employees
- `getSelfLeaveHistory()` - Fetch your own leave requests
- `getSelfLeaveBalance(yearStart)` - Get your leave balance
- `getMonthlyLeaves(month, year)` - Get leaves for a specific month

#### Added Types:
```typescript
- CreateLeaveDto
- Leave
- LeaveBalance
- LeaveType
```

---

### 2. **Custom Hook** (`src/hooks/useLeave.ts`)
New `useLeave()` hook provides:

**State Management:**
- `leaves` - All leave requests
- `myLeaves` - Your leave requests
- `pendingLeaves` - Pending requests for approval
- `leaveBalance` - Leave balance data
- `myLeaveBalance` - Your leave balance
- `isLoading` - Loading state
- `isSubmitting` - Submission state
- `error` - Error messages
- `success` - Success messages

**Actions:**
- `applyLeave(dto)` - Apply for leave
- `approveLeave(id)` - Approve a request
- `rejectLeave(id, remarks)` - Reject a request
- `fetchLeaveHistory()` - Load leave history
- `fetchMyLeaveHistory()` - Load your history
- `fetchPendingLeaves()` - Load pending requests
- `fetchLeaveBalance(yearStart)` - Load balance data
- `fetchMyLeaveBalance(yearStart)` - Load your balance
- `fetchMonthlyLeaves(month, year)` - Load monthly leaves

---

### 3. **UI Components**

#### **ApplyLeaveModal** (`src/components/leave/ApplyLeaveModal.tsx`)
Modal for submitting leave requests with:
- Leave type selection (Casual, Sick, Privilege, Comp Off, Maternity, Paternity)
- Start and end date pickers
- Duration type (Full Day / Half Day)
- Reason text area
- Form validation

#### **ApproveRejectLeaveModal** (`src/components/leave/ApproveRejectLeaveModal.tsx`)
Modal for approving/rejecting with:
- Leave details display
- Optional remarks field for rejection
- Separate approve/reject buttons with different styles
- Confirmation flow

---

### 4. **Updated LeaveManagement Component**
Fully refactored with:

**Features:**
- Real API data instead of mock data
- Leave balance cards with visual progress
- Your leave history table
- Pending leave requests table (for Admin/HR/Manager)
- Modal integration for applying and approving/rejecting leaves
- Error and success message handling
- Role-based access control
- Real-time state updates

**Displays for Different Roles:**
- **Employee**: Can view their balance, history, and apply for leave
- **Admin/HR/Manager**: Can also see pending requests and approve/reject them

---

## 🚀 Usage Examples

### In React Components:

```typescript
import { useLeave } from '../hooks/useLeave';

const MyComponent = () => {
  const { 
    myLeaves, 
    myLeaveBalance, 
    applyLeave, 
    fetchMyLeaveBalance 
  } = useLeave();

  // Apply for leave
  const handleApply = async () => {
    await applyLeave({
      leaveTypeId: 1,
      startDate: '2024-02-15',
      endDate: '2024-02-16',
      durationType: 'FULL_DAY',
      reason: 'Personal work'
    });
  };

  // Load balance
  useEffect(() => {
    fetchMyLeaveBalance(2024);
  }, []);

  return (
    // Your UI here
  );
};
```

---

## 📝 API Endpoints Reference

```
POST   /leaves/apply              - Apply for leave
PATCH  /leaves/approve/:id        - Approve leave
PATCH  /leaves/reject/:id         - Reject leave
GET    /leaves/history            - Get leave history (role-based)
GET    /leaves/pending            - Get pending requests
GET    /leaves/balance            - Get all balances
GET    /leaves/self/history       - Get own history
GET    /leaves/self/balance       - Get own balance
GET    /leaves/self/monthly       - Get monthly leaves
```

---

## 🔄 Data Flow

1. **Component** → Displays UI with `useLeave()` hook state
2. **User Action** → Clicks Apply/Approve/Reject button
3. **Hook** → Calls respective API method via `api.ts`
4. **API Service** → Makes HTTP request to backend
5. **Backend** → Processes request, updates database
6. **Response** → Returns updated data
7. **Hook** → Updates state with new data
8. **Component** → Re-renders with updated data

---

## ✨ Features Implemented

✅ Apply for leave with multiple leave types  
✅ View leave balance with visual progress bars  
✅ View your leave history  
✅ Approve/Reject leave requests (with remarks)  
✅ See pending requests (Admin/HR/Manager only)  
✅ Monthly leave view  
✅ Error handling and user feedback  
✅ Role-based access control  
✅ Loading states  
✅ Success/Error notifications  

---

## 🛠️ To Use in Other Components

Easy to integrate anywhere via the `useLeave` hook:

```typescript
import { useLeave } from '../hooks/useLeave';

export const EmployeeDashboard = () => {
  const { myLeaveBalance, fetchMyLeaveBalance } = useLeave();

  useEffect(() => {
    fetchMyLeaveBalance(2024);
  }, []);

  return (
    <div>
      {myLeaveBalance.map(balance => (
        <p>{balance.leaveType}: {balance.remaining} days remaining</p>
      ))}
    </div>
  );
};
```

---

## ⚙️ Backend Requirements

Ensure your NestJS backend has:
- JWT authentication middleware
- Prisma models for Leave, LeaveBalance, LeaveType
- Leave and LeaveScheduler services
- Leave controller with all endpoints
- Proper error handling and validation

---

## Notes

- All dates are handled as strings in ISO format (YYYY-MM-DD)
- Financial year is calculated automatically (April 1 - March 31)
- Leave balance includes allocated days, carry forward, and used days
- Error messages are displayed to users in red banners
- Success messages appear briefly after actions
- Loading states prevent duplicate submissions

---

## 🎯 Next Steps

1. Test each endpoint with your backend
2. Adjust error messages as needed
3. Customize colors in balance cards
4. Add more leave types if needed
5. Integrate notifications for approvals/rejections
6. Add leave calendar view (optional)
