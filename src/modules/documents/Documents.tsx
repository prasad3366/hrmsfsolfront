import React, { useEffect, useState } from 'react';
import api, { EmployeeDirectoryResponse } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../../components/ui/components';

export const MANAGEMENT_DOCUMENT_ROLES = ['SUPER_ADMIN', 'CEO', 'HR'] as const;

export const isManagementDocumentRole = (role: string | null | undefined): boolean =>
  MANAGEMENT_DOCUMENT_ROLES.includes(role as (typeof MANAGEMENT_DOCUMENT_ROLES)[number]);

export const getDocumentTargetEmployeeId = (
  role: string | null | undefined,
  selectedEmployeeId: number | undefined,
  selfEmployeeId: number | undefined,
): number | undefined => isManagementDocumentRole(role) ? selectedEmployeeId : selfEmployeeId;

const Documents = () => {
  const { user, role } = useAuth();
  const { addNotification } = useNotifications();
  const isManagementUser = isManagementDocumentRole(role);
  const [employeeId, setEmployeeId] = useState<number | undefined>(() => {
    if (isManagementDocumentRole(role)) return undefined;
    const n = Number(user?.employeeId);
    return Number.isInteger(n) && n > 0 ? n : undefined;
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [resolved, setResolved] = useState<boolean>(false);
  const [required, setRequired] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 10; // number of rows per page

  const [selectedFiles, setSelectedFiles] = useState<Record<number, File>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectionDocumentId, setRejectionDocumentId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedFiles({});
    setPage(1);
  }, [employeeId, selectedEmployeeId]);

  const fetchEmployeeList = async () => {
    try {
      const response = await api.getAllEmployees() as EmployeeDirectoryResponse;
      const list = response.data;
      setEmployeeList(list || []);
      if (selectedEmployeeId == null && list?.length > 0) {
        setSelectedEmployeeId(list[0].id);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load employee list');
      console.error('Failed to fetch employee list', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      // try to resolve employee id from JWT-derived user info
      if (employeeId == null && user) {
        const maybeId = Number((user as any).employeeId);
        if (Number.isInteger(maybeId) && maybeId > 0) setEmployeeId(maybeId);
      }

      if (isManagementUser) {
        await fetchEmployeeList();
      }

      // fetch lists
      const loadForId = isManagementUser ? selectedEmployeeId : employeeId;
      if (loadForId) {
        setSelectedEmployeeId(loadForId);
        await fetchRequired();
      }
      if (loadForId) await fetchDocuments();
      setResolved(true);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, selectedEmployeeId, role, user, isManagementUser]);

  const getCurrentEmployeeId = (): number | undefined => {
    return getDocumentTargetEmployeeId(role, selectedEmployeeId, employeeId);
  };

  const hasUploadableDocumentType = required.some((document) => {
    const id = Number(document.id);
    return Number.isInteger(id) && id > 0;
  });

  const getDocumentStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const fetchRequired = async () => {
    try {
      setError(null);
      const targetId = getCurrentEmployeeId();
      if (!targetId) {
        setRequired([]);
        return;
      }

      const [employeeInfo, res] = await Promise.all([
        api.getEmployeeById(targetId),
        api.getRequiredDocuments(targetId),
      ]);

      let requiredDocs = res || [];

      // If employee is experienced, ensure Relieving Letter is shown even if backend does not include it
      if (
        employeeInfo?.isExperienced === true &&
        !requiredDocs.some((doc: any) =>
          String(doc.name).toLowerCase().includes('relieving'),
        )
      ) {
        requiredDocs = [
          ...requiredDocs,
          {
            id: -1,
            name: 'Relieving Letter',
            virtual: true,
          },
        ];
      }

      setRequired(requiredDocs);
    } catch (e: any) {
      setError(e.message || 'Failed to load required documents');
    }
  };

  const fetchDocuments = async () => {
    try {
      setError(null);
      const targetId = getCurrentEmployeeId();
      if (!targetId) {
        setDocs([]);
        return;
      }
      const res = await api.getDocuments(targetId ? Math.floor(targetId) : undefined, role || undefined);
      setDocs(res || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load documents');
      console.error('getDocuments error:', e);
    }
  };

  const retryResolve = async () => {
    setResolved(false);
    setError(null);
    setEmployeeId(undefined);
    try {
      const maybeId = Number((user as any).employeeId);
      if (Number.isInteger(maybeId) && maybeId > 0) setEmployeeId(maybeId);
    } catch (err) {
      console.error('retryResolve error:', err);
    } finally {
      setResolved(true);
    }
  };

  const handleFileChange = (documentTypeId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFiles((current) => ({
        ...current,
        [documentTypeId]: e.target.files![0],
      }));
      console.log('File captured:', e.target.files[0].name);
    }
  };

  const handleApprove = async (documentId: number) => {
    try {
      setLoading(true);
      await api.updateDocumentStatus(documentId, 'APPROVED', role || '');
      fetchDocuments();
    } catch (e: any) {
      alert(e.message || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = (documentId: number) => {
    setRejectionDocumentId(documentId);
    setRejectionReason('');
    setRejectionError(null);
  };

  const closeRejectionDialog = () => {
    if (loading) return;
    setRejectionDocumentId(null);
    setRejectionReason('');
    setRejectionError(null);
  };

  const submitRejection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalizedReason = rejectionReason.trim();

    if (!normalizedReason) {
      setRejectionError('Rejection reason is required.');
      return;
    }

    if (rejectionDocumentId == null) return;

    try {
      setLoading(true);
      await api.updateDocumentStatus(
        rejectionDocumentId,
        'REJECTED',
        role || '',
        normalizedReason,
      );
      await fetchDocuments();
      closeRejectionDialog();
    } catch (e: any) {
      setRejectionError(e.message || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (documentId: number) => {
    try {
      setLoading(true);
      const { blob } = await api.downloadDocumentFile(documentId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // optionally revoke URL later
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e: any) {
      alert(e.message || 'Failed to fetch file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId: number, fileName?: string) => {
    try {
      setLoading(true);
      const { blob, fileName: responseFileName } = await api.downloadDocumentFile(documentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = responseFileName || fileName || `document-${documentId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || 'Failed to download file');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (
    e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();

    const selectedEntries = required
      .map((document) => Number(document.id))
      .filter((documentTypeId) => Number.isInteger(documentTypeId) && documentTypeId > 0)
      .map((documentTypeId) => ({ documentTypeId, file: selectedFiles[documentTypeId] }))
      .filter((entry): entry is { documentTypeId: number; file: File } => Boolean(entry.file));

    if (selectedEntries.length === 0) {
      setError('Please select a file before uploading.');
      alert('Please select a file');
      return;
    }

    try {
      setLoading(true);
      const targetId = getCurrentEmployeeId();
      if (!targetId || !Number.isInteger(targetId) || targetId <= 0) {
        const message = isManagementUser
          ? 'Please select an employee before uploading.'
          : 'Employee profile is not available. Please try again after your profile loads.';
        setError(message);
        alert(message);
        return;
      }

      console.log('Uploading document through the EmployeeDocument endpoint', {
        employeeId: targetId,
        documentTypeIds: selectedEntries.map((entry) => entry.documentTypeId),
        fileNames: selectedEntries.map((entry) => entry.file.name),
      });

      await api.uploadDocuments(
        targetId,
        selectedEntries.map((entry) => entry.documentTypeId),
        selectedEntries.map((entry) => entry.file),
      );

      setError(null);
      setSelectedFiles({});
      await fetchDocuments();
      alert('Upload successful!');
      addNotification({
        type: 'other',
        title: 'Documents uploaded',
        message: 'The documents were uploaded successfully and the list was refreshed.',
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err?.message || 'Upload failed.');
      alert('Upload failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            {(() => {
              if (isManagementUser) {
                return (
                  <div className="text-sm text-slate-600">
                    {selectedEmployeeId == null ? 'Select an employee.' : 'Employee selected.'}
                  </div>
                );
              }

              if (resolved === false) {
                return <div className="text-sm text-slate-500">Resolving employee identity...</div>;
              }

              if (employeeId == null) {
                return <div className="text-sm text-rose-600">Could not auto-detect employee. Contact HR to link your account.</div>;
              }

              return <div className="text-sm text-slate-600">Employee detected.</div>;
            })()}
          </div>

          {isManagementUser && (
            <div className="mb-4">
              <label htmlFor="selectEmployee" className="text-xs font-medium text-slate-600 mb-1 block">Select Employee</label>
              <select
                id="selectEmployee"
                value={selectedEmployeeId || ''}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  if (!Number.isInteger(selectedId)) return;
                  setSelectedEmployeeId(selectedId);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select an employee</option>
                {employeeList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.empCode || emp.email || emp.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="mb-3 text-red-600">
              {error}
              <div className="mt-2">
                <Button onClick={() => fetchDocuments()}>Retry fetch</Button>
                <Button className="ml-2" variant="secondary" onClick={retryResolve}>Retry detect</Button>
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleUploadSubmit(e)}>
            <h4 className="font-semibold mb-2">Required Documents</h4>
            {!hasUploadableDocumentType ? (
              <div className="text-sm text-slate-500">
                No applicable document types are configured for this employee. Upload is unavailable.
              </div>
            ) : (
              required.filter((document) => Number(document.id) > 0).map((r) => (
                <div key={`${r.id}-${r.name}`} className="flex items-center gap-3 mb-2">
                  <div className="flex-1">
                    {r.name}
                    {r.virtual && (
                      <span className="ml-2 text-xs text-rose-600">
                        (added as experienced-only fallback)
                      </span>
                    )}
                  </div>

                  <input
                    key={`${r.id}-${getCurrentEmployeeId()}`}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(e) => handleFileChange(Number(r.id), e)}
                  />
                  {selectedFiles[Number(r.id)] && (
                    <span className="text-xs text-slate-600">
                      {selectedFiles[Number(r.id)].name}
                    </span>
                  )}
                </div>
              ))
            )}

            <div className="mt-4">
              <Button
                type="button"
                onClick={(e) => void handleUploadSubmit(e)}
                disabled={loading || !hasUploadableDocumentType || !getCurrentEmployeeId()}
              >
                {loading ? 'Uploading...' : 'Upload Documents'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Submitted Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <div className="text-sm text-slate-500">No documents submitted yet.</div>
          ) : (
            <>
              <table className="w-full text-sm">
              <thead className="text-slate-500 text-left">
                <tr>
                  <th>Employee</th>
                  <th>Document</th>
                  <th>File</th>
                  <th>Status</th>
                  {isManagementUser && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {docs.slice((page-1)*perPage, page*perPage).map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-2">{d.employee?.firstName || d.employeeId}</td>
                    <td className="p-2">{d.documentType?.name || d.documentTypeId}</td>
                    <td className="p-2 flex items-center gap-4">
                      <span>{d.fileName}</span>
                      {isManagementUser && (
                        <div className="flex flex-wrap items-center gap-2 ml-4">
                        <Button size="xs" variant="outline" className="flex items-center gap-1" onClick={() => handleView(d.id)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => handleDownload(d.id, d.fileName)}>Download</Button>
                        </div>
                      )}
                    </td>
                    <td className="p-2">
                      <Badge variant={getDocumentStatusVariant(d.status)}>{d.status}</Badge>
                      {d.status === 'REJECTED' && (d.remarks || d.rejectionReason) && (
                        <div className="mt-1 text-xs text-rose-700">
                          Reason: {d.remarks || d.rejectionReason}
                        </div>
                      )}
                    </td>
                    {isManagementUser && (
                      <td className="p-2">
                        {d.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <Button size="xs" variant="primary" className="bg-green-600 text-white hover:bg-green-700" onClick={() => handleApprove(d.id)}>Approve</Button>
                            <Button size="xs" variant="danger" onClick={() => handleReject(d.id)}>Reject</Button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-between items-center">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">Page {page}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={page * perPage >= docs.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </>)}
        </CardContent>
      </Card>

      {rejectionDocumentId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Reject document</h2>
            <p className="mt-1 text-sm text-slate-600">
              Provide a reason for rejecting this document.
            </p>
            <form onSubmit={submitRejection} className="mt-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-slate-700">
                Rejection reason
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectionError) setRejectionError(null);
                }}
                rows={4}
                autoFocus
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter the rejection reason"
              />
              {rejectionError && (
                <p className="mt-1 text-sm text-rose-600">{rejectionError}</p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeRejectionDialog} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" disabled={loading}>
                  {loading ? 'Rejecting...' : 'Reject document'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
