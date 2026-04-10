'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadStatus, addLeadNote } from '@/app/actions/leads';

const COLUMNS = [
  { key: 'new', label: 'New', color: 'bg-slate-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
  { key: 'qualified', label: 'Qualified', color: 'bg-indigo-500' },
  { key: 'trial_scheduled', label: 'Trial Scheduled', color: 'bg-purple-500' },
  { key: 'trial_completed', label: 'Trial Done', color: 'bg-amber-500' },
  { key: 'converted', label: 'Converted', color: 'bg-green-500' },
  { key: 'lost', label: 'Lost', color: 'bg-red-400' },
];

interface LeadKanbanProps {
  columns: Record<string, any[]>;
}

export function LeadKanban({ columns }: LeadKanbanProps) {
  const router = useRouter();
  const [dragging, setDragging] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleDrop(newStatus: string) {
    if (!dragging) return;
    setLoading(true);
    await updateLeadStatus(dragging, newStatus);
    setDragging(null);
    setLoading(false);
    router.refresh();
  }

  async function handleAddNote(leadId: string) {
    if (!noteText.trim()) return;
    setLoading(true);
    await addLeadNote(leadId, noteText.trim());
    setNoteText('');
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLUMNS.map(col => (
        <div
          key={col.key}
          className="flex-shrink-0 w-64 bg-slate-50 rounded-xl"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(col.key)}
        >
          {/* Column Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200">
            <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
            <span className="text-sm font-semibold text-slate-700">{col.label}</span>
            <span className="ml-auto text-xs text-slate-400 bg-slate-200 rounded-full px-1.5 py-0.5">
              {columns[col.key]?.length || 0}
            </span>
          </div>

          {/* Cards */}
          <div className="p-2 space-y-2 min-h-[200px] max-h-[600px] overflow-y-auto">
            {(columns[col.key] || []).map((lead: any) => (
              <div
                key={lead.id}
                draggable
                onDragStart={() => setDragging(lead.id)}
                onDragEnd={() => setDragging(null)}
                className={`bg-white rounded-lg border border-slate-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow ${
                  dragging === lead.id ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-slate-900 text-sm leading-tight">
                    {lead.parent_name}
                  </p>
                  {lead.score > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      lead.score >= 70 ? 'bg-green-100 text-green-700' :
                      lead.score >= 40 ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {lead.score}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 truncate">{lead.parent_email}</p>

                {lead.student_name && (
                  <p className="text-xs text-slate-600 mt-1">
                    Student: {lead.student_name}
                    {lead.student_grade && ` (Grade ${lead.student_grade})`}
                  </p>
                )}

                {lead.subjects_interested?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {lead.subjects_interested.slice(0, 3).map((subj: string) => (
                      <span key={subj} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                        {subj}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">
                    {lead.source.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                    className="text-[10px] text-blue-600 hover:text-blue-800"
                  >
                    {expandedLead === lead.id ? 'Close' : 'Details'}
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedLead === lead.id && (
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
                    {lead.goals && (
                      <p className="text-xs text-slate-600"><span className="font-medium">Goals:</span> {lead.goals}</p>
                    )}
                    {lead.notes && (
                      <p className="text-xs text-slate-600"><span className="font-medium">Notes:</span> {lead.notes}</p>
                    )}
                    {lead.assigned_user?.full_name && (
                      <p className="text-xs text-slate-600"><span className="font-medium">Assigned:</span> {lead.assigned_user.full_name}</p>
                    )}
                    {lead.next_follow_up_at && (
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Follow-up:</span>{' '}
                        {new Date(lead.next_follow_up_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}

                    {/* Quick Note */}
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add note..."
                        className="flex-1 text-xs border border-slate-200 rounded px-2 py-1"
                      />
                      <button
                        onClick={() => handleAddNote(lead.id)}
                        disabled={loading || !noteText.trim()}
                        className="text-xs bg-blue-600 text-white rounded px-2 py-1 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {(columns[col.key] || []).length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No leads
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
