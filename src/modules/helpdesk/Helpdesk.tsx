import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HelpdeskTicket } from '../../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Input, Label } from '../../components/ui/components';
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import api from '../../services/api';

const STORAGE_KEY = 'foodeez_helpdesk_tickets';

const normalizeStatus = (status?: string): HelpdeskTicket['status'] => {
  const normalized = status?.toString().toUpperCase() ?? '';
  if (normalized === 'APPROVED') return 'Approved';
  if (normalized === 'RESOLVED') return 'Resolved';
  return 'Pending';
};

const getStatusVariant = (status: HelpdeskTicket['status']) => {
  switch (normalizeStatus(status)) {
    case 'Approved':
      return 'success';
    case 'Resolved':
      return 'purple';
    default:
      return 'warning';
  }
};

const getStatusText = (status: HelpdeskTicket['status']) => {
  switch (normalizeStatus(status)) {
    case 'Approved':
      return 'Approved';
    case 'Resolved':
      return 'Resolved';
    default:
      return 'Pending';
  }
};

const normalizeHelpdeskTicket = (ticket: any, currentUser?: any): HelpdeskTicket => {
  const employee = ticket.employee ?? null;
  const user = ticket.user ?? null;
  const issue = ticket.issue ?? ticket.title ?? '';
  const reason = ticket.reason ?? ticket.description ?? '';
  const createdAt = ticket.createdAt ?? new Date().toISOString();
  const updatedAt = ticket.updatedAt ?? createdAt;
  const requestedById = Number(ticket.requestedById ?? ticket.employeeId ?? user?.id ?? currentUser?.employeeId ?? 0);
  const requestedByEmail = ticket.requestedByEmail ?? user?.email ?? currentUser?.email ?? '';
  const fallbackName = `${employee?.firstName ?? user?.name ?? currentUser?.name ?? ''} ${employee?.lastName ?? ''}`.trim();
  const requestedByName =
    ticket.requestedByName ??
    (fallbackName || user?.email) ??
    'Unknown';
  const requestedByRole = ticket.requestedByRole ?? user?.role ?? currentUser?.role ?? 'EMPLOYEE';

  return {
    id: String(ticket.id ?? generateTicketId()),
    requestedById,
    requestedByName,
    requestedByEmail,
    requestedByRole,
    issue,
    reason,
    status: normalizeStatus(ticket.status),
    createdAt,
    updatedAt,
  };
};

const generateTicketId = () => `HD-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;

const Helpdesk = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [reason, setReason] = useState('');
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isHR = user?.role === 'HR';

  // Load tickets from API (with fallback to localStorage)
  useEffect(() => {
    const loadTickets = async () => {
      setIsLoading(true);
      let localTickets: HelpdeskTicket[] = [];

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          localTickets = JSON.parse(stored) as HelpdeskTicket[];
        } catch (parseErr) {
          console.warn('Failed to parse helpdesk tickets from localStorage:', parseErr);
          localTickets = [];
        }
      }

      try {
        let apiTickets: any[] = [];
        if (isHR) {
          apiTickets = await api.getHelpdeskTickets();
        } else {
          apiTickets = await api.getMyHelpdeskTickets();
        }

        const normalizedTickets = (apiTickets || []).map((ticket: any) => normalizeHelpdeskTicket(ticket, user));

        const merged = normalizedTickets.map((apiTicket) => {
          const localTicket = localTickets.find((ticket) => ticket.id === apiTicket.id);
          if (localTicket && (localTicket.status === 'Approved' || localTicket.status === 'Resolved')) {
            return localTicket;
          }
          return apiTicket;
        });

        localTickets.forEach((localTicket) => {
          if (!merged.find((ticket) => ticket.id === localTicket.id)) {
            merged.push(localTicket);
          }
        });

        setTickets(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch (apiErr) {
        console.warn('Failed to fetch from API, falling back to localStorage:', apiErr);
        if (localTickets.length > 0) {
          setTickets(localTickets);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();

    // Listen for helpdesk updates from HR Dashboard or other components
    const handleHelpdeskUpdate = (event: any) => {
      const { ticketId, status } = event.detail;
      setTickets((prev) => {
        const updated = prev.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: normalizeStatus(status), updatedAt: new Date().toISOString() }
            : ticket
        );
        // Also update localStorage to keep it in sync
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener('helpdeskTicketsUpdated', handleHelpdeskUpdate);

    return () => {
      window.removeEventListener('helpdeskTicketsUpdated', handleHelpdeskUpdate);
    };
  }, [user?.id, isHR, user]);

  const visibleTickets = useMemo(() => {
    if (!user) return [];
    if (isHR) return tickets;
    // Filter by employeeId as primary (stable across sessions), fall back to email
    return tickets.filter(
      (ticket) =>
        (user.employeeId && ticket.requestedById === user.employeeId) ||
        (user.email && ticket.requestedByEmail === user.email)
    );
  }, [tickets, user, isHR]);

  const clearAlerts = () => {
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAlerts();

    if (!subject.trim() || !reason.trim()) {
      setError('Please enter both issue and reason.');
      return;
    }

    if (!user) {
      setError('User information is not available. Please refresh and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Try to submit via API first
      try {
        const apiTicket = await api.createHelpdeskTicket({
          issue: subject.trim(),
          reason: reason.trim(),
        });
        const newTicket = normalizeHelpdeskTicket(apiTicket, user);
        setTickets((prev) => {
          const updated = [newTicket, ...prev];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      } catch (apiErr) {
        console.warn('Failed to create via API, creating locally:', apiErr);
        // Create locally if API fails
        const newTicket: HelpdeskTicket = {
          id: generateTicketId(),
          requestedById: Number(user.employeeId ?? 0),
          requestedByName: user.name,
          requestedByEmail: user.email,
          requestedByRole: user.role,
          issue: subject.trim(),
          reason: reason.trim(),
          status: 'Pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setTickets((prev) => {
          const updated = [newTicket, ...prev];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }
      
      setSubject('');
      setReason('');
      setMessage('Issue submitted successfully and routed to HR.');
    } catch (err) {
      setError((err instanceof Error ? err.message : 'Failed to submit issue'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, nextStatus: HelpdeskTicket['status']) => {
    try {
      // Try API first
      try {
        if (nextStatus === 'Approved') {
          await api.approveHelpdeskTicket(ticketId);
        } else if (nextStatus === 'Resolved') {
          await api.resolveHelpdeskTicket(ticketId);
        }
      } catch (apiErr) {
        console.warn('Failed via API, updating locally:', apiErr);
      }

      // Update local state and sync storage in one step to avoid stale tickets
      setTickets((prev) => {
        const updated = prev.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: normalizeStatus(nextStatus), updatedAt: new Date().toISOString() }
            : ticket
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      
      // Emit event to notify other components (e.g., HRDashboard) that tickets were updated
      window.dispatchEvent(new CustomEvent('helpdeskTicketsUpdated', { detail: { ticketId, status: nextStatus } }));
      
      setMessage(`Ticket ${nextStatus.toLowerCase()} successfully.`);
    } catch (err) {
      setError((err instanceof Error ? err.message : 'Failed to update ticket'));
    }
  };

  const handleApprove = (ticketId: string) => {
    updateTicketStatus(ticketId, 'Approved');
  };

  const handleResolve = (ticketId: string) => {
    updateTicketStatus(ticketId, 'Resolved');
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Helpdesk</h1>
          <p className="mt-2 text-slate-500 max-w-2xl">
            Report laptop or equipment issues and route them to HR. HR can approve the report and mark it as resolved so the requester can see the final status.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
          <p className="text-sm font-semibold">HR Actions</p>
          <p className="text-xs text-slate-500 mt-1">Approve first, then Resolve to complete the ticket.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-200">
          <CardTitle>Raise a Helpdesk Issue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1">
              <Label htmlFor="helpdesk-issue">Issue</Label>
              <Input
                id="helpdesk-issue"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Describe the laptop or equipment issue"
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="helpdesk-reason">Reason</Label>
              <textarea
                id="helpdesk-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain why this issue matters or how it affects your work"
                className="w-full min-h-[120px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">Your report will be visible to HR and tracked by status.</div>
              <Button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2">
                <Send size={16} /> {isSubmitting ? 'Submitting...' : 'Submit Issue'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-200">
          <CardTitle>{isHR ? 'All Helpdesk Tickets' : 'My Helpdesk Tickets'}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading helpdesk tickets...</div>
          ) : (
          <Table className="min-w-full">
            <thead>
              <TableRow className="bg-slate-100">
                <TableHead className="p-3 text-left text-xs uppercase tracking-wide text-slate-500">Ticket</TableHead>
                <TableHead className="p-3 text-left text-xs uppercase tracking-wide text-slate-500">Requested By</TableHead>
                <TableHead className="p-3 text-left text-xs uppercase tracking-wide text-slate-500">Status</TableHead>
                <TableHead className="p-3 text-left text-xs uppercase tracking-wide text-slate-500">Created</TableHead>
                <TableHead className="p-3 text-left text-xs uppercase tracking-wide text-slate-500">Actions</TableHead>
              </TableRow>
            </thead>
            <tbody>
              {visibleTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-4 text-center text-slate-500">
                    No helpdesk tickets found.
                  </TableCell>
                </TableRow>
              ) : (
                visibleTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="border-t border-slate-100">
                    <TableCell className="p-3 align-top">
                      <div className="font-semibold text-slate-900">{ticket.issue}</div>
                      <div className="text-sm text-slate-500 mt-1">{ticket.reason}</div>
                    </TableCell>
                    <TableCell className="p-3 align-top">
                      <div className="font-medium text-slate-900">{ticket.requestedByName}</div>
                      <div className="text-sm text-slate-500">{ticket.requestedByRole}</div>
                    </TableCell>
                    <TableCell className="p-3 align-top">
                      <Badge variant={getStatusVariant(ticket.status)}>{getStatusText(ticket.status)}</Badge>
                    </TableCell>
                    <TableCell className="p-3 align-top text-slate-500 text-sm">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="p-3 align-top space-y-2">
                      {isHR && ticket.status === 'Pending' && (
                        <Button size="sm" variant="secondary" onClick={() => handleApprove(ticket.id)}>
                          Approve
                        </Button>
                      )}
                      {isHR && ticket.status !== 'Resolved' && (
                        <Button size="sm" variant="primary" onClick={() => handleResolve(ticket.id)}>
                          Resolve
                        </Button>
                      )}
                      {!isHR && ticket.status === 'Resolved' && (
                        <div className="text-sm font-medium text-emerald-700">Resolved by HR</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Helpdesk;
