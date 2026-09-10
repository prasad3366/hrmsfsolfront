import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Home, Plus, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWfh } from '../../hooks/useWfh';
import { RequestWfhModal } from '../../components/wfh/RequestWfhModal';
import { WfhApprovalList } from '../../components/wfh/WfhApprovalList';
import { WfhRequest } from '../../services/api';
import { canAccessWfh, canManageWfh } from './wfh-roles';

const StatusBadge = ({ status }: { status: WfhRequest['status'] }) => {
  const styles = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const Icon = status === 'PENDING' ? Clock : status === 'APPROVED' ? CheckCircle : XCircle;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}><Icon size={14} />{status}</span>;
};

const WfhHistory = ({ requests, isLoading, error, onRetry }: { requests: WfhRequest[]; isLoading: boolean; error: string | null; onRetry: () => void }) => {
  if (isLoading) return <div className="py-12 text-center text-slate-500">Loading your WFH requests...</div>;
  if (error) return <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><span className="flex items-center gap-2"><AlertCircle size={18} />{error}</span><button onClick={onRetry} className="inline-flex items-center gap-1 font-semibold hover:underline"><RefreshCw size={15} />Retry</button></div>;
  if (requests.length === 0) return <div className="py-12 text-center text-slate-500">No WFH requests yet.</div>;
  return <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500"><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id} className="border-b border-slate-100 text-sm"><td className="px-4 py-4 text-slate-700">{new Date(request.startDate).toLocaleDateString()} to {new Date(request.endDate).toLocaleDateString()}</td><td className="px-4 py-4 text-slate-600">{request.reason || '-'}</td><td className="px-4 py-4"><StatusBadge status={request.status} /></td></tr>)}</tbody></table></div>;
};

const Wfh = () => {
  const { user } = useAuth();
  const role = user?.role;
  const canManage = canManageWfh(role);
  const canSelfServe = canAccessWfh(role);
  const { wfhRequests, myWfhRequests, isAllLoading, isMyLoading, allError, myError, isSubmitting, error, success, fetchAllWfhRequests, fetchMyWfhRequests, requestWfh, approveWfh, rejectWfh, clearMessages } = useWfh();
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  useEffect(() => {
    if (canManage) fetchAllWfhRequests();
    if (canSelfServe) fetchMyWfhRequests();
  }, [canManage, canSelfServe, fetchAllWfhRequests, fetchMyWfhRequests]);

  if (!user || (!canManage && !canSelfServe)) {
    return <div className="p-8 text-center text-slate-500">Access Denied. You do not have permission to view WFH.</div>;
  }

  return <main className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#2A4B9B]"><Home size={18} />Work From Home</div><h1 className="text-3xl font-bold text-slate-900">WFH requests</h1><p className="mt-1 text-sm text-slate-500">Submit and track server-managed work from home requests.</p></div>
      {canSelfServe && <button onClick={() => setIsRequestOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2A4B9B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#213d80]"><Plus size={17} />Request WFH</button>}
    </div>

    {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}

    {canManage && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Requests for your scope</h2><p className="text-sm text-slate-500">Results and authorization are provided by the server.</p></div><button onClick={fetchAllWfhRequests} disabled={isAllLoading} aria-label="Refresh WFH requests" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={17} /></button></div>{isAllLoading ? <div className="py-12 text-center text-slate-500">Loading WFH requests...</div> : allError ? <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><span className="flex items-center gap-2"><AlertCircle size={18} />{allError}</span><button onClick={fetchAllWfhRequests} className="inline-flex items-center gap-1 font-semibold hover:underline"><RefreshCw size={15} />Retry</button></div> : <WfhApprovalList requests={wfhRequests} isLoading={false} onRefresh={fetchAllWfhRequests} approveWfh={approveWfh} rejectWfh={rejectWfh} isSubmitting={isSubmitting} error={error} success={success} />}</section>}

    {canSelfServe && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5"><h2 className="text-lg font-semibold text-slate-900">My WFH history</h2><p className="text-sm text-slate-500">Your status is updated from the WFH service.</p></div><WfhHistory requests={myWfhRequests} isLoading={isMyLoading} error={myError} onRetry={fetchMyWfhRequests} /></section>}

    <RequestWfhModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} onSuccess={fetchMyWfhRequests} requestWfh={requestWfh} isSubmitting={isSubmitting} error={error} success={success} clearMessages={clearMessages} />
  </main>;
};

export default Wfh;
