import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../../components/ui/components';

const Documents = () => {
  const { user, role } = useAuth();
  const [employeeId, setEmployeeId] = useState<number | undefined>(() => {
    const n = Number(user?.id);
    return Number.isInteger(n) ? n : undefined;
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [resolved, setResolved] = useState<boolean>(false);
  const [required, setRequired] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 10; // number of rows per page

  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployeeList = async () => {
    try {
      const list = await api.getAllEmployees();
      setEmployeeList(list || []);
      if (!selectedEmployeeId && list?.length > 0) {
        setSelectedEmployeeId(list[0].id);
      }
    } catch (e: any) {
      console.error('Failed to fetch employee list', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      // try to resolve employee id from JWT-derived user info
      if (!employeeId && user) {
        const maybeId = Number((user as any).employeeId || user.id);
        if (Number.isInteger(maybeId)) setEmployeeId(maybeId);
      }

      if (role === 'HR' || role === 'ADMIN') {
        await fetchEmployeeList();
      }

      // fetch lists
      const loadForId = (role === 'HR' || role === 'ADMIN') ? selectedEmployeeId : employeeId;
      if (loadForId) {
        setSelectedEmployeeId(loadForId);
        await fetchRequired();
      }
      await fetchDocuments();
      setResolved(true);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, selectedEmployeeId, role, user]);

  const getCurrentEmployeeId = () => {
    if (role === 'HR' || role === 'ADMIN') {
      return selectedEmployeeId || employeeId;
    }
    return employeeId;
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
      const maybeId = Number((user as any).employeeId || user?.id);
      if (Number.isInteger(maybeId)) setEmployeeId(maybeId);
    } catch (err) {
      console.error('retryResolve error:', err);
    } finally {
      setResolved(true);
    }
  };

  const onFileChange = (docTypeId: number | string, f?: File) => setFiles((s) => ({ ...s, [docTypeId]: f || null }));

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

  const handleReject = async (documentId: number) => {
    try {
      setLoading(true);
      await api.updateDocumentStatus(documentId, 'REJECTED', role || '');
      fetchDocuments();
    } catch (e: any) {
      alert(e.message || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (documentId: number) => {
    try {
      setLoading(true);
      const { blob, fileName, mimeType } = await api.downloadDocumentFile(documentId);
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

  const handleUpload = async () => {
    const targetId = getCurrentEmployeeId();
    if (!targetId) return alert('Employee id not detected. Contact HR.');
    const docIds: number[] = [];
    const uploadFiles: File[] = [];
    for (const r of required) {
      if ((r as any).virtual) continue; // skip synthetic fallback docs because id is not known
      const f = files[r.id];
      if (f) {
        docIds.push(r.id);
        uploadFiles.push(f);
      }
    }
    if (uploadFiles.length === 0) return alert('Please choose files to upload');
    try {
      setLoading(true);
      await api.uploadDocuments(targetId, docIds, uploadFiles);
      alert('Uploaded');
      setFiles({});
      fetchDocuments();
    } catch (e: any) {
      alert(e.message || 'Upload failed');
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
            {!resolved ? (
              <div className="text-sm text-slate-500">Resolving employee identity...</div>
            ) : !employeeId ? (
              <div className="text-sm text-rose-600">Could not auto-detect employee. Contact HR to link your account.</div>
            ) : (
              <div className="text-sm text-slate-600">Employee detected.</div>
            )}
          </div>

          {(role === 'HR' || role === 'ADMIN') && (
            <div className="mb-4">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Select Employee</label>
              <select
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

          <h4 className="font-semibold mb-2">Required Documents</h4>
          {required.length === 0 ? (
            <div className="text-sm text-slate-500">No required documents found.</div>
          ) : (
            required.map((r) => (
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
                  type="file"
                  onChange={(e) => {
                    const fileKey = r.virtual ? 'virtual-relieving' : r.id;
                    onFileChange(fileKey as any, e.target.files?.[0]);
                  }}
                />
              </div>
            ))
          )}

          <div className="mt-4">
            <Button onClick={handleUpload} disabled={loading}>{loading ? 'Uploading...' : 'Upload Documents'}</Button>
          </div>
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
                  {(role === 'HR' || role === 'ADMIN') && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {docs.slice((page-1)*perPage, page*perPage).map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-2">{d.employee?.firstName || d.employeeId}</td>
                    <td className="p-2">{d.documentType?.name || d.documentTypeId}</td>
                    <td className="p-2 flex items-center gap-4">
                      <span>{d.fileName}</span>
                      {(role === 'HR' || role === 'ADMIN') && (
                        <Button size="xs" variant="outline" className="flex items-center gap-1 ml-4" onClick={() => handleView(d.id)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </Button>
                      )}
                    </td>
                    <td className="p-2 flex items-center gap-2">
                      <Badge variant={d.status === 'APPROVED' ? 'success' : d.status === 'PENDING' ? 'warning' : 'danger'}>{d.status}</Badge>
                    </td>
                    {(role === 'HR' || role === 'ADMIN') && (
                      <td className="p-2">
                        {d.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <Button size="xs" variant="success" className="bg-green-600 text-white hover:bg-green-700" onClick={() => handleApprove(d.id)}>Approve</Button>
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
    </div>
  );
};

export default Documents;
