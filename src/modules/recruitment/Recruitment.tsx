import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../../components/ui/components';
import { Plus, MoreHorizontal, Calendar, MessageSquare, Paperclip } from 'lucide-react';

interface Candidate {
    id: string;
    name: string;
    role: string;
    date: string;
    tag: string;
}

const KANBAN_DATA: Record<string, Candidate[]> = {
    "Applied": [
        { id: "c1", name: "John Doe", role: "Frontend Dev", date: "2m ago", tag: "Senior" },
        { id: "c2", name: "Jane Smith", role: "Product Designer", date: "1d ago", tag: "Mid" },
        { id: "c5", name: "Robert Fox", role: "Backend Dev", date: "3d ago", tag: "Junior" },
    ],
    "Screening": [
        { id: "c3", name: "Alice Brown", role: "Marketing Lead", date: "4h ago", tag: "Lead" },
    ],
    "Interview": [
        { id: "c4", name: "Charlie Day", role: "Sales Manager", date: "2d ago", tag: "Sales" },
    ],
    "Offer": [],
    "Hired": []
};

const CandidateCard = ({ candidate }: { candidate: Candidate }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing mb-3 group">
        <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-slate-800 text-sm">{candidate.name}</h4>
            <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal size={14} />
            </button>
        </div>
        <p className="text-xs text-slate-500 mb-3">{candidate.role}</p>
        <div className="flex items-center gap-2 mb-3">
             <Badge variant="blue" className="bg-blue-50 text-blue-600 border-none px-1.5 py-0.5 rounded text-[10px]">{candidate.tag}</Badge>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
            <div className="flex items-center gap-3 text-slate-400">
                <MessageSquare size={12} className="hover:text-blue-500 cursor-pointer"/>
                <Paperclip size={12} className="hover:text-blue-500 cursor-pointer"/>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">{candidate.date}</span>
        </div>
    </div>
);

const KanbanColumn = ({ title, count, candidates, color }: { title: string, count: number, candidates: Candidate[], color: string }) => (
    <div className="flex-shrink-0 w-72 flex flex-col h-full">
        <div className={`flex items-center justify-between mb-3 px-1`}>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${color}`}></div>
                <h3 className="font-bold text-slate-700 text-sm">{title}</h3>
                <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{count}</span>
            </div>
            <Plus size={14} className="text-slate-400 cursor-pointer hover:text-slate-800" />
        </div>
        <div className="bg-slate-100/50 rounded-xl p-2 h-full min-h-[500px] border border-slate-100/50">
            {candidates.map(c => <CandidateCard key={c.id} candidate={c} />)}
            {candidates.length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                    Drop here
                </div>
            )}
        </div>
    </div>
);

const Recruitment = () => {
  return (
    <div className="p-6 md:p-8 max-w-full h-[calc(100vh-64px)] flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recruitment Pipeline</h1>
          <p className="text-slate-500 text-sm">Manage candidates and job openings</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">Pipeline View</Button>
            <Button className="gap-2"><Plus size={16}/> Add Candidate</Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-max">
            <KanbanColumn title="Applied" count={3} candidates={KANBAN_DATA["Applied"]} color="bg-slate-400" />
            <KanbanColumn title="Screening" count={1} candidates={KANBAN_DATA["Screening"]} color="bg-blue-400" />
            <KanbanColumn title="Interview" count={1} candidates={KANBAN_DATA["Interview"]} color="bg-purple-400" />
            <KanbanColumn title="Offer Sent" count={0} candidates={[]} color="bg-orange-400" />
            <KanbanColumn title="Hired" count={0} candidates={[]} color="bg-emerald-400" />
        </div>
      </div>
    </div>
  );
};

export default Recruitment;