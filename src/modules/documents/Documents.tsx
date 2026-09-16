import React, { useEffect, useState } from 'react';
import api, { EmployeeDirectoryResponse } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card, CardHeader, CardTitle, CardContent, Button, DataTable, EmptyState, PageHeader, Select, Skeleton, StatusBadge, type DataTableColumn } from '../../components/ui/components';

export const MANAGEMENT_DOCUMENT_ROLES = ['SUPER_ADMIN', 'CEO', 'HR'] as const;

export const isManagementDocumentRole = (role: string | null | undefined): boolean =>
  MANAGEMENT_DOCUMENT_ROLES.includes(role as (typeof MANAGEMENT_DOCUMENT_ROLES)[number]);

export const canUploadDocuments = (role: string | null | undefined): boolean =>
  isManagementDocumentRole(role);

export const getDocumentTargetEmployeeId = (
  role: string | null | undefined,
  selectedEmployeeId: number | undefined,
  selfEmployeeId: number | undefined,
): number | undefined => isManagementDocumentRole(role) ? selectedEmployeeId : selfEmployeeId;

const Documents = () => {
  const { user, role } = useAuth();
  const { addNotification } = useNotifications();
  const isManagementUser = isManagementDocumentRole(role);
  const canUpload = canUploadDocuments(role);
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

  useEffect(() => {
    let mounted = true;

    if (isManagementUser) {
      setEmployeeId(undefined);
      setResolved(true);
      api.getAllEmployees({ page: 1, pageSize: 10000, sortBy: 'name', sortDirection: 'asc' })
        .then((response: EmployeeDirectoryResponse) => {
          if (mounted) setEmployeeList(response.data || []);
        })
        .catch((err: any) => {
          if (mounted) setError(err.message || 'Failed to load employees');
        });

      return () => {
        mounted = false;
      };
    }

    setEmployeeList([]);
    const resolvedEmployeeId = Number(user?.employeeId);
    setEmployeeId(Number.isInteger(resolvedEmployeeId) && resolvedEmployeeId > 0 ? resolvedEmployeeId : undefined);
    setResolved(true);

    return () => {
      mounted = false;
    };
  }, [isManagementUser, user?.employeeId]);

  const getCurrentEmployeeId = (): number | undefined => {
    return getDocumentTargetEmployeeId(role, selectedEmployeeId, employeeId);
  };

  const hasUploadableDocumentType = required.some((document) => {
    const id = Number(document.id);
    return Number.isInteger(id) && id > 0;
  });

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

  useEffect(() => {
    const targetId = getCurrentEmployeeId();
    if (!targetId) {
      setRequired([]);
      setDocs([]);
      return;
    }

    void fetchRequired();
    void fetchDocuments();
  }, [role, employeeId, selectedEmployeeId]);

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

  const documentColumns: DataTableColumn<any>[] = [
    ...(isManagementUser ? [{ key: 'employee', header: 'Employee', render: (document: any) => <span className="font-semibold text-[#12354a]">{document.employee?.firstName || document.employeeId || '-'}</span> }] : []),
    { key: 'document', header: 'Document', render: (document) => <span className="font-semibold text-[#12354a]">{document.documentType?.name || document.documentTypeId || 'Document'}</span> },
    { key: 'file', header: 'File', render: (document) => <span className="block max-w-56 truncate text-sm text-[#617984]" title={document.fileName}>{document.fileName || '-'}</span> },
    { key: 'uploadedAt', header: 'Uploaded', render: (document) => document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : '-' },
    { key: 'status', header: 'Status', render: (document) => <div><StatusBadge status={document.status === 'APPROVED' ? 'success' : document.status === 'REJECTED' ? 'danger' : document.status === 'PENDING' ? 'warning' : 'neutral'}>{document.status}</StatusBadge>{document.status === 'REJECTED' && (document.remarks || document.rejectionReason) && <p className="mt-1 max-w-56 text-xs text-[#a63e35]">{document.remarks || document.rejectionReason}</p>}</div> },
    ...(isManagementUser ? [{ key: 'actions', header: 'Actions', render: (document: any) => <div className="flex flex-wrap items-center gap-2"><Button size="xs" variant="outline" onClick={() => handleView(document.id)}>View</Button><Button size="xs" variant="outline" onClick={() => handleDownload(document.id, document.fileName)}>Download</Button>{document.status === 'PENDING' && <><Button size="xs" variant="gold" onClick={() => handleApprove(document.id)} disabled={loading}>Approve</Button><Button size="xs" variant="danger" onClick={() => handleReject(document.id)} disabled={loading}>Reject</Button></>}</div> }] : []),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Documents" description={isManagementUser ? 'Review and manage employee documents.' : 'View your submitted employee documents.'} />
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#e4ecec] bg-[#f6faf9]/70">
          <CardTitle>{isManagementUser ? 'Document workspace' : 'My documents'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            {(() => {
              if (isManagementUser) {
                return (
                  <div className="rounded-xl border border-[#cce1e8] bg-[#eaf3f7] p-3 text-sm text-[#486271]">
                    {selectedEmployeeId == null ? 'Select an employee.' : 'Employee selected.'}
                  </div>
                );
              }

              if (resolved === false) {
                return <div className="flex items-center gap-3 text-sm text-[#617984]"><Skeleton className="h-7 w-7 rounded-full" />Resolving employee identity...</div>;
              }

              if (employeeId == null) {
                return <div className="text-sm text-[#a63e35]">Could not auto-detect employee. Contact HR to link your account.</div>;
              }

              return <div className="text-sm text-[#617984]">Employee detected.</div>;
            })()}
          </div>

          {isManagementUser && (
            <div className="mb-4">
              <label htmlFor="selectEmployee" className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#617984]">Select employee</label>
              <Select
                id="selectEmployee"
                value={selectedEmployeeId || ''}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  if (!Number.isInteger(selectedId)) return;
                  setSelectedEmployeeId(selectedId);
                }}
                className="max-w-xl"
              >
                <option value="">Select an employee</option>
                {employeeList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.empCode || emp.email || emp.id})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-xl border border-[#f3c9c3] bg-[#fff1ef] p-4 text-[#a63e35]">
              {error}
              <div className="mt-2"><Button variant="outline" onClick={() => fetchDocuments()}>Retry fetch</Button><Button className="ml-2" variant="secondary" onClick={retryResolve}>Retry detect</Button></div>
            </div>
          )}

          {canUpload && (
            <form onSubmit={(e) => handleUploadSubmit(e)}>
              <h4 className="mb-3 font-bold text-[#12354a]">Required documents</h4>
              {!hasUploadableDocumentType ? (
                <div className="rounded-xl border border-dashed border-[#cbd9dc] bg-[#f6faf9] p-4 text-sm text-[#617984]">No applicable document types are configured for this employee. Upload is unavailable.</div>
              ) : required.filter((document) => Number(document.id) > 0).map((document) => (
                <div key={`${document.id}-${document.name}`} className="mb-3 flex flex-col gap-3 rounded-xl border border-[#dce6e8] bg-white p-4 sm:flex-row sm:items-center">
                  <div className="flex-1 font-semibold text-[#12354a]">{document.name}{document.virtual && <span className="ml-2 text-xs text-[#a63e35]">(added as experienced-only fallback)</span>}</div>
                  <input key={`${document.id}-${getCurrentEmployeeId()}`} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => handleFileChange(Number(document.id), e)} />
                  {selectedFiles[Number(document.id)] && <span className="text-xs text-[#617984]">{selectedFiles[Number(document.id)].name}</span>}
                </div>
              ))}
              <div className="mt-4"><Button variant="gold" type="button" onClick={(e) => void handleUploadSubmit(e)} disabled={loading || !hasUploadableDocumentType || !getCurrentEmployeeId()}>{loading ? 'Uploading...' : 'Upload documents'}</Button></div>
            </form>
          )}
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
              <DataTable columns={documentColumns} data={docs.slice((page - 1) * perPage, page * perPage)} getRowKey={(document) => document.id} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#022337]/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-white/70 bg-[#fffefa] p-5 shadow-[0_24px_80px_rgba(2,35,55,0.24)]">
            <h2 className="text-lg font-bold text-[#073b5c]">Reject document</h2>
            <p className="mt-1 text-sm text-[#617984]">
              Provide a reason for rejecting this document.
            </p>
            <form onSubmit={submitRejection} className="mt-4">
              <label htmlFor="rejectionReason" className="block text-sm font-semibold text-[#12354a]">
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
                className="mt-1 w-full rounded-xl border border-[#cbd9dc] px-3 py-2 text-sm text-[#12354a] focus:border-[#b08a3e] focus:outline-none focus:ring-2 focus:ring-[#b08a3e]/20"
                placeholder="Enter the rejection reason"
              />
              {rejectionError && (
                <p className="mt-1 text-sm text-rose-600">{rejectionError}</p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeRejectionDialog} disabled={loading}>
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
