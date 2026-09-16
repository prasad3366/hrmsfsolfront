# HRMS PASS 4 - Frontend API & Business Logic Audit

Status: Read-only audit baseline. No implementation changes made.

## Scope
This pass establishes the actual current frontend behavior as implemented in the live source and compares that behavior against the backend API surface implied by the frontend service layer. The audit focuses on route protection, auth/session identity, role-based access, and business-domain data flows.

## Source of truth reviewed
- [src/App.tsx](src/App.tsx)
- [src/context/AuthContext.tsx](src/context/AuthContext.tsx)
- [src/services/api.ts](src/services/api.ts)
- [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx)
- [src/modules/dashboard/DashboardRouter.tsx](src/modules/dashboard/DashboardRouter.tsx)
- [src/modules/documents/Documents.tsx](src/modules/documents/Documents.tsx)
- [src/modules/helpdesk/Helpdesk.tsx](src/modules/helpdesk/Helpdesk.tsx)
- [src/pages/ReportsPage.tsx](src/pages/ReportsPage.tsx)
- [src/pages/AnnouncementsPage.tsx](src/pages/AnnouncementsPage.tsx)
- [src/modules/performance/Performance.tsx](src/modules/performance/Performance.tsx)
- [src/hooks/useLeave.ts](src/hooks/useLeave.ts)
- [src/hooks/useWfh.ts](src/hooks/useWfh.ts)
- [src/hooks/usePayroll.ts](src/hooks/usePayroll.ts)
- [src/hooks/useSalary.ts](src/hooks/useSalary.ts)

## 1) Actual current frontend behavior

### Auth and session baseline
- The app bootstraps through `AuthProvider` in [src/App.tsx](src/App.tsx) and [src/context/AuthContext.tsx](src/context/AuthContext.tsx).
- On startup, the app reads `accessToken` from `localStorage`.
- If a token exists, it decodes the JWT payload with a local `atob`-based helper and builds a `User` object from claims such as `email`, `name`, `role`, `department`, `designation`, and `employeeId`.
- For employees, it calls `api.getEmployeeIdByUserId()` to resolve `employeeId` if the token payload does not already contain it.
- The app stores the resolved user in `foodeez_user` and also persists the auth tokens in local storage.
- Login calls `api.login()` and then reconstructs a user object from the returned JWT when it can, otherwise falls back to a derived user model from the email.
- Logout clears the user and token storage and calls `api.logout()` best-effort.

### Routing and access control baseline
- Routing is defined in [src/App.tsx](src/App.tsx) using `BrowserRouter`, nested routes under `/`, and a `ProtectedRoute` wrapper.
- `ProtectedRoute` redirects unauthenticated users to `/login` and enforces `allowedRoles` when present.
- The route tree currently includes the following protected app pages:
  - `/dashboard`
  - `/employees`
  - `/employees/:id`
  - `/attendance`
  - `/employee-attendance`
  - `/leave`
  - `/wfh`
  - `/payroll`
  - `/team`
  - `/recruitment`
  - `/assets`
  - `/holidays`
  - `/performance`
  - `/documents`
  - `/helpdesk`
  - `/training`
  - `/announcements`
  - `/reports`
  - `/settings`
- The app treats role checks as string-based and uses explicit arrays for each route, with additional role constants imported from helper files such as `WFH_ROLES`, `HOLIDAY_MANAGEMENT_ROLES`, and `REPORTS_ROLES`.

### API integration baseline
- The primary backend integration surface is centralized in [src/services/api.ts](src/services/api.ts).
- It defines a singleton `ApiService`/`api` export and wraps fetch requests with auth header injection and token refresh logic on 401 responses.
- The service includes endpoints for auth, attendance, leave, WFH, payroll, salary, employee directory, employee 360 profile, documents, announcements, reports, team, assets, recruitment, helpdesk, settings, and documents export.
- It normalizes a number of response envelopes so frontend code tolerates either direct arrays or `{ data: [...] }`-style payloads.
- The API layer contains compatibility handling for multiple backend response shapes rather than a single strict contract.

### Business module behavior
- Attendance is implemented via local state hooks plus normalized attendance status mapping in [src/hooks/useAttendance.ts](src/hooks/useAttendance.ts).
- Leave uses [src/hooks/useLeave.ts](src/hooks/useLeave.ts) and merges multiple response sets, including pending requests plus active resolved records; it deduplicates by ID and the most recent `updatedAt`.
- WFH uses [src/hooks/useWfh.ts](src/hooks/useWfh.ts) and dispatches a browser event on updates (`wfh-updated`) to refresh multiple views.
- Payroll uses [src/hooks/usePayroll.ts](src/hooks/usePayroll.ts), and the comment in the hook explicitly states that it always fetches the current user's own payroll via `/payroll/my` even when a caller passes an employeeId.
- Salary logic uses [src/hooks/useSalary.ts](src/hooks/useSalary.ts) and exposes both employee-specific and all-salary fetch paths.
- Performance management in [src/modules/performance/Performance.tsx](src/modules/performance/Performance.tsx) is localStorage-backed and not connected to a backend API service.
- Announcements in [src/pages/AnnouncementsPage.tsx](src/pages/AnnouncementsPage.tsx) are CRUD-driven through the API layer and role-aware by department/manager logic.
- Reports in [src/pages/ReportsPage.tsx](src/pages/ReportsPage.tsx) load a summary and export CSVs; this is API-driven but not deeply tied to backend-specific response normalization beyond the summary payload.
- Documents in [src/modules/documents/Documents.tsx](src/modules/documents/Documents.tsx) implement a management-versus-self selection identity model, with logic to resolve a target employee ID based on the current role and selected employee.
- Helpdesk in [src/modules/helpdesk/Helpdesk.tsx](src/modules/helpdesk/Helpdesk.tsx) normalizes tickets from different possible backend shapes and filters employee-owned tickets after loading.

## 2) Findings by classification

### A. FACTUAL CURRENT BEHAVIOR
- The frontend runs as a role-based React + TypeScript app with a nested protected route tree and a custom auth context.
- Access control is enforced by comparing the logged-in user role against hard-coded route permission arrays in [src/App.tsx](src/App.tsx), not by a central permission model.
- The app persists auth information in browser storage (`accessToken`, `refreshToken`, `foodeez_user`) and restores it on reload.
- JWT claims are treated as the source of truth for `role`, `department`, `designation`, and `employeeId` when present.
- Employee-specific identity resolution is partly JWT-based and partly API-based: if `employeeId` is missing in the token, the app calls `api.getEmployeeIdByUserId()`.
- The API layer centralizes request construction, auth headers, refresh retry logic, and domain endpoints in a single place.
- Several screens explicitly support both employee self-service and management-mode views: documents, attendance, leave, WFH, payroll, and employee profile screens all contain role gates and alternate target-selection behaviors.
- The performance module is client-only and does not use any domain API surface; it persists goals and reviews to `localStorage`.
- The frontend includes compatibility logic for multiple response envelopes and multiple backend shapes, especially in attendance, WFH, documents, helpdesk, and employee directory handling.

### B. DUPLICATED / CONFLICTING IMPLEMENTATION
- Role definitions are spread across multiple places instead of being centralized in a single canonical access model. Examples include route arrays in [src/App.tsx](src/App.tsx), helper constants in role files, and UI-specific arrays in modules like documents and leave.
- The app contains multiple ways to resolve the same underlying concept: `user.employeeId`, `selectedEmployeeId`, and `role-based target selection` are handled in different screens and can diverge from one another.
- There are overlapping backend API patterns for the same business concept. For example, document-related calls, WFH calls, and leave history calls are normalized or patched around multiple response shapes rather than relying on a single expected contract.
- Payroll logic is internally inconsistent: the hook comment explicitly says it always uses `/payroll/my`, while the method signature still accepts an `employeeId` parameter and callers still pass one in some flows.
- Leave logic loads `pendingLeaves` by combining `api.getPendingLeaves()` with a paginated `api.getLeaveHistory()` pass and then filtering active resolved records. This means the frontend is assembling a manager queue from multiple API calls and custom logic instead of relying on one canonical backend response.
- WFH and helpdesk screens both use local refresh events (`window.dispatchEvent`) to update state after backend mutations, creating a UI-level synchronization model that is not tied to a consistent server-side state contract.
- Performance is implemented as a standalone local CRUD module, which duplicates operational HR features without any backend integration path, making it functionally separate from the rest of the app’s domain model.

### C. POTENTIAL RISK
- JWT claims are trusted as identity data on the client, which means the app depends on token claims carrying correct, non-tampered values for role and `employeeId`.
- The app resolves employee identity asynchronously in some cases, but many screens assume `user.employeeId` or a selected employee ID is already available. This creates race conditions around initial render and profile-dependent flows.
- `api.getEmployeeIdByUserId()` is called in auth bootstrap for employees, which means the app depends on a backend route being available and returning the expected shape at first load.
- The frontend’s compatibility logic indicates the backend contract may not be stable or uniform across endpoints. This raises the risk of contract drift between the API and the frontend client.
- A number of pages continue to accept fallback or virtual data values (for example, the document management screen injecting a `Relieving Letter` record when `isExperienced` is true), which suggests the frontend is compensating for missing or incomplete server responses.
- Many pages use direct browser-side state refresh events as a partial synchronization mechanism; if the backend response shape or timing changes, the UI can get out of sync without a robust server-driven state update.
- The app includes a `reports` page and several export actions, but the actual report payloads are tolerated through summary-object access patterns rather than a single explicit contract, which increases the chance of silent runtime mismatches.
- Performance management is completely decoupled from backend data, so it may diverge from real employee performance records or not reflect actual HR workflows if the backend eventually exposes a source of truth.

## 3) Contract-risk summary
The current frontend is not consistently aligned to a single backend contract. The codebase shows a real-world pattern of:
- normalizing multiple response envelope shapes,
- resolving identity from both JWT and network calls,
- compensating for missing server values,
- and mixing local UI state refresh with server-backed API actions.

This is not a clean “single source of truth” implementation. It is a compatibility-heavy frontend that is actively adapting to a moving backend contract and a mixed set of role/identity assumptions.

## 4) Final assessment
This pass establishes the actual baseline of the frontend as currently implemented:
- the app is operationally route-protected,
- the auth model is JWT-driven and local-storage-backed,
- the API layer is the central integration surface,
- the UI contains several role-aware and self-vs-management hybrids,
- and the codebase contains multiple signs of backend contract drift, duplicated business logic, and role/identity ambiguity.

The findings above are documented as factual behavior, duplicated/conflicting implementations, and potential risk items without proposing implementation changes. This document is intended to support the next requirement-alignment pass rather than fix the code.
