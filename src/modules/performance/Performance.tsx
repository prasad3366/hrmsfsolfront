import React, { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Edit3,
  Plus,
  Star,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Table, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/components';

type GoalCategory = 'OKR' | 'KPI' | 'Development';
type GoalStatus = 'On track' | 'At risk' | 'Completed';
type ReviewStatus = 'Draft' | 'In progress' | 'Completed';

interface PerformanceGoal {
  id: string;
  category: GoalCategory;
  title: string;
  description: string;
  progress: number;
  dueDate: string;
  status: GoalStatus;
}

interface PerformanceReview {
  id: string;
  employeeName: string;
  reviewCycle: string;
  status: ReviewStatus;
  selfRating: number;
  managerRating: number;
  feedback: string;
}

type GoalForm = Omit<PerformanceGoal, 'id'>;
type ReviewForm = Omit<PerformanceReview, 'id'>;

const GOALS_STORAGE_KEY = 'foodeez_performance_goals';
const REVIEWS_STORAGE_KEY = 'foodeez_performance_reviews';

const defaultGoals: PerformanceGoal[] = [
  { id: 'goal-1', category: 'OKR', title: 'Improve employee onboarding', description: 'Reduce time to productivity by creating a consistent, measurable onboarding journey.', progress: 72, dueDate: '2026-10-31', status: 'On track' },
  { id: 'goal-2', category: 'KPI', title: 'Increase payroll accuracy', description: 'Maintain accurate monthly payroll processing with clear exception controls.', progress: 88, dueDate: '2026-12-15', status: 'On track' },
  { id: 'goal-3', category: 'Development', title: 'Complete leadership programme', description: 'Build coaching capability through the internal manager development programme.', progress: 45, dueDate: '2026-11-20', status: 'At risk' },
  { id: 'goal-4', category: 'OKR', title: 'Launch quarterly engagement pulse', description: 'Deliver an actionable engagement survey and publish the follow-up plan.', progress: 100, dueDate: '2026-09-30', status: 'Completed' },
  { id: 'goal-5', category: 'KPI', title: 'Resolve helpdesk requests faster', description: 'Improve first-response times while preserving service quality and auditability.', progress: 64, dueDate: '2026-10-15', status: 'On track' },
  { id: 'goal-6', category: 'Development', title: 'Earn people analytics certification', description: 'Complete the approved analytics certification and apply the learning to reporting.', progress: 30, dueDate: '2026-12-01', status: 'At risk' },
];

const defaultReviews: PerformanceReview[] = [
  { id: 'review-1', employeeName: 'Ananya Sharma', reviewCycle: 'Q3 2026 Mid-year', status: 'In progress', selfRating: 4, managerRating: 4, feedback: 'Strong delivery across onboarding and employee experience initiatives.' },
  { id: 'review-2', employeeName: 'Rahul Mehta', reviewCycle: 'Q3 2026 Mid-year', status: 'Completed', selfRating: 5, managerRating: 4, feedback: 'Consistently dependable with excellent ownership of operational priorities.' },
  { id: 'review-3', employeeName: 'Priya Nair', reviewCycle: 'Annual Review 2025-26', status: 'Draft', selfRating: 3, managerRating: 0, feedback: 'Self-review is ready for manager input and calibration.' },
  { id: 'review-4', employeeName: 'Arjun Rao', reviewCycle: 'Q3 2026 Mid-year', status: 'In progress', selfRating: 4, managerRating: 3, feedback: 'Making good progress; focus next quarter on stakeholder communication.' },
];

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed: unknown = JSON.parse(stored);
    return parsed && Array.isArray(parsed) ? parsed as T : fallback;
  } catch {
    return fallback;
  }
};

const formatDate = (date: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`));

const categoryVariant: Record<GoalCategory, 'purple' | 'blue' | 'warning'> = { OKR: 'purple', KPI: 'blue', Development: 'warning' };
const statusVariant: Record<GoalStatus, 'success' | 'warning' | 'purple'> = { 'On track': 'success', 'At risk': 'warning', Completed: 'purple' };

const emptyGoal: GoalForm = { category: 'OKR', title: '', description: '', progress: 0, dueDate: '', status: 'On track' };
const emptyReview: ReviewForm = { employeeName: '', reviewCycle: '', status: 'Draft', selfRating: 0, managerRating: 0, feedback: '' };

const RatingStars = ({ rating, tone }: { rating: number; tone: 'amber' | 'indigo' }) => (
  <span className={`inline-flex items-center gap-0.5 ${tone === 'amber' ? 'text-amber-500' : 'text-indigo-500'}`} aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={14} fill={star <= rating ? 'currentColor' : 'none'} strokeWidth={1.8} />)}
  </span>
);

const Modal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
    <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><X size={18} /></button>
      </div>
      {children}
    </div>
  </div>
);

const Performance = () => {
  const [activeTab, setActiveTab] = useState<'goals' | 'reviews'>('goals');
  const [goals, setGoals] = useState<PerformanceGoal[]>(() => readStorage(GOALS_STORAGE_KEY, defaultGoals));
  const [reviews, setReviews] = useState<PerformanceReview[]>(() => readStorage(REVIEWS_STORAGE_KEY, defaultReviews));
  const [goalForm, setGoalForm] = useState<GoalForm>(emptyGoal);
  const [reviewForm, setReviewForm] = useState<ReviewForm>(emptyReview);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [modal, setModal] = useState<'goal' | 'review' | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals)), [goals]);
  useEffect(() => localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews)), [reviews]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const closeModal = () => { setModal(null); setError(''); };
  const openGoal = (goal?: PerformanceGoal) => {
    setEditingGoalId(goal?.id ?? null);
    setGoalForm(goal ? { category: goal.category, title: goal.title, description: goal.description, progress: goal.progress, dueDate: goal.dueDate, status: goal.status } : emptyGoal);
    setModal('goal');
  };
  const openReview = (review?: PerformanceReview) => {
    setEditingReviewId(review?.id ?? null);
    setReviewForm(review ? { employeeName: review.employeeName, reviewCycle: review.reviewCycle, status: review.status, selfRating: review.selfRating, managerRating: review.managerRating, feedback: review.feedback } : emptyReview);
    setModal('review');
  };
  const saveGoal = (event: FormEvent) => {
    event.preventDefault();
    if (!goalForm.title.trim() || !goalForm.description.trim() || !goalForm.dueDate) return setError('Enter a title, description, and due date.');
    const next = editingGoalId ? goals.map((goal) => goal.id === editingGoalId ? { ...goal, ...goalForm, title: goalForm.title.trim(), description: goalForm.description.trim() } : goal) : [...goals, { ...goalForm, id: `goal-${Date.now()}`, title: goalForm.title.trim(), description: goalForm.description.trim() }];
    setGoals(next);
    closeModal();
    setToast(editingGoalId ? 'Goal updated successfully.' : 'Goal created successfully.');
  };
  const saveReview = (event: FormEvent) => {
    event.preventDefault();
    if (!reviewForm.employeeName.trim() || !reviewForm.reviewCycle.trim() || !reviewForm.feedback.trim()) return setError('Enter an employee, review cycle, and feedback.');
    const next = editingReviewId ? reviews.map((review) => review.id === editingReviewId ? { ...review, ...reviewForm, employeeName: reviewForm.employeeName.trim(), reviewCycle: reviewForm.reviewCycle.trim(), feedback: reviewForm.feedback.trim() } : review) : [...reviews, { ...reviewForm, id: `review-${Date.now()}`, employeeName: reviewForm.employeeName.trim(), reviewCycle: reviewForm.reviewCycle.trim(), feedback: reviewForm.feedback.trim() }];
    setReviews(next);
    closeModal();
    setToast(editingReviewId ? 'Review updated successfully.' : 'Review cycle created successfully.');
  };
  const deleteGoal = (id: string) => { setGoals((current) => current.filter((goal) => goal.id !== id)); setToast('Goal deleted successfully.'); };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600"><Award size={17} /> People performance</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Performance Management</h1>
          <p className="mt-1 text-sm text-slate-500">Align goals, review progress, and support meaningful growth.</p>
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => activeTab === 'goals' ? openGoal() : openReview()}><Plus size={17} /> {activeTab === 'goals' ? 'Add goal' : 'New review'}</Button>
      </div>

      <div className="flex gap-6 border-b border-slate-200" role="tablist">
        <button type="button" role="tab" aria-selected={activeTab === 'goals'} onClick={() => setActiveTab('goals')} className={`border-b-2 px-1 pb-3 text-sm font-semibold transition ${activeTab === 'goals' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}><Target size={16} className="mr-2 inline" />Goals &amp; OKRs</button>
        <button type="button" role="tab" aria-selected={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} className={`border-b-2 px-1 pb-3 text-sm font-semibold transition ${activeTab === 'reviews' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}><TrendingUp size={16} className="mr-2 inline" />Appraisal Reviews</button>
      </div>

      {activeTab === 'goals' ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <Card key={goal.id} hoverEffect className="flex flex-col rounded-xl">
              <CardHeader className="flex-row items-start justify-between gap-3"><div><Badge variant={categoryVariant[goal.category]}>{goal.category}</Badge><h2 className="mt-3 text-base font-bold text-slate-900">{goal.title}</h2></div><div className="flex gap-1"><button type="button" onClick={() => openGoal(goal)} aria-label={`Edit ${goal.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"><Edit3 size={16} /></button><button type="button" onClick={() => deleteGoal(goal.id)} aria-label={`Delete ${goal.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button></div></CardHeader>
              <CardContent className="flex flex-1 flex-col pt-2"><p className="min-h-[48px] text-sm leading-6 text-slate-500">{goal.description}</p><div className="mt-5"><div className="mb-2 flex justify-between text-xs font-semibold"><span className="text-slate-500">Progress</span><span className="text-slate-900">{goal.progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all duration-700 ease-out" style={{ width: `${goal.progress}%` }} /></div></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">Due {formatDate(goal.dueDate)}</span><Badge variant={statusVariant[goal.status]}>{goal.status}</Badge></div></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-xl"><CardHeader className="border-b border-slate-100"><CardTitle>Review cycles</CardTitle><p className="text-sm text-slate-500">Track calibration and feedback across the organization.</p></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow className="bg-slate-50"><TableHead>Employee name</TableHead><TableHead>Review cycle</TableHead><TableHead>Status</TableHead><TableHead>Self-rating</TableHead><TableHead>Manager rating</TableHead><TableHead>Feedback</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><tbody>{reviews.map((review) => <TableRow key={review.id}><TableCell className="font-semibold text-slate-900">{review.employeeName}</TableCell><TableCell className="whitespace-nowrap">{review.reviewCycle}</TableCell><TableCell><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">{review.status === 'Completed' ? <CheckCircle2 size={15} className="text-emerald-500" /> : review.status === 'In progress' ? <Clock size={15} className="text-amber-500" /> : <AlertCircle size={15} className="text-slate-400" />}{review.status}</span></TableCell><TableCell><RatingStars rating={review.selfRating} tone="amber" /></TableCell><TableCell><RatingStars rating={review.managerRating} tone="indigo" /></TableCell><TableCell className="max-w-xs truncate text-slate-500" title={review.feedback}>{review.feedback}</TableCell><TableCell><Button size="sm" variant="outline" className="gap-1.5" onClick={() => openReview(review)}><Edit3 size={14} /> Review</Button></TableCell></TableRow>)}</tbody></Table></CardContent></Card>
      )}

      {toast && <div role="status" className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-xl"><CheckCircle2 size={18} />{toast}</div>}

      {modal === 'goal' && <Modal title={editingGoalId ? 'Edit goal' : 'Create goal'} onClose={closeModal}><form onSubmit={saveGoal} className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Category<select value={goalForm.category} onChange={(event) => setGoalForm({ ...goalForm, category: event.target.value as GoalCategory })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal focus:border-indigo-500 focus:outline-none"><option>OKR</option><option>KPI</option><option>Development</option></select></label><label className="text-sm font-semibold text-slate-700">Due date<Input required type="date" value={goalForm.dueDate} onChange={(event) => setGoalForm({ ...goalForm, dueDate: event.target.value })} className="mt-1.5" /></label></div><label className="block text-sm font-semibold text-slate-700">Title<Input required value={goalForm.title} onChange={(event) => setGoalForm({ ...goalForm, title: event.target.value })} placeholder="e.g. Improve employee onboarding" className="mt-1.5" /></label><label className="block text-sm font-semibold text-slate-700">Description<textarea required value={goalForm.description} onChange={(event) => setGoalForm({ ...goalForm, description: event.target.value })} rows={3} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Progress (%)<Input type="number" min="0" max="100" value={goalForm.progress} onChange={(event) => setGoalForm({ ...goalForm, progress: Math.min(100, Math.max(0, Number(event.target.value))) })} className="mt-1.5" /></label><label className="text-sm font-semibold text-slate-700">Status<select value={goalForm.status} onChange={(event) => setGoalForm({ ...goalForm, status: event.target.value as GoalStatus })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal"><option>On track</option><option>At risk</option><option>Completed</option></select></label></div>{error && <p className="text-sm text-rose-600">{error}</p>}<div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><Button type="button" variant="outline" onClick={closeModal}>Cancel</Button><Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Save goal</Button></div></form></Modal>}
      {modal === 'review' && <Modal title={editingReviewId ? 'Edit appraisal review' : 'Create review cycle'} onClose={closeModal}><form onSubmit={saveReview} className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Employee name<Input required value={reviewForm.employeeName} onChange={(event) => setReviewForm({ ...reviewForm, employeeName: event.target.value })} placeholder="e.g. Ananya Sharma" className="mt-1.5" /></label><label className="text-sm font-semibold text-slate-700">Review cycle<Input required value={reviewForm.reviewCycle} onChange={(event) => setReviewForm({ ...reviewForm, reviewCycle: event.target.value })} placeholder="e.g. Q4 2026" className="mt-1.5" /></label></div><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-semibold text-slate-700">Status<select value={reviewForm.status} onChange={(event) => setReviewForm({ ...reviewForm, status: event.target.value as ReviewStatus })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm font-normal"><option>Draft</option><option>In progress</option><option>Completed</option></select></label><label className="text-sm font-semibold text-slate-700">Self-rating<Input type="number" min="0" max="5" value={reviewForm.selfRating} onChange={(event) => setReviewForm({ ...reviewForm, selfRating: Math.min(5, Math.max(0, Number(event.target.value))) })} className="mt-1.5" /></label><label className="text-sm font-semibold text-slate-700">Manager rating<Input type="number" min="0" max="5" value={reviewForm.managerRating} onChange={(event) => setReviewForm({ ...reviewForm, managerRating: Math.min(5, Math.max(0, Number(event.target.value))) })} className="mt-1.5" /></label></div><label className="block text-sm font-semibold text-slate-700">Feedback<textarea required value={reviewForm.feedback} onChange={(event) => setReviewForm({ ...reviewForm, feedback: event.target.value })} rows={4} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" /></label>{error && <p className="text-sm text-rose-600">{error}</p>}<div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><Button type="button" variant="outline" onClick={closeModal}>Cancel</Button><Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Save review</Button></div></form></Modal>}
    </div>
  );
};

export default Performance;