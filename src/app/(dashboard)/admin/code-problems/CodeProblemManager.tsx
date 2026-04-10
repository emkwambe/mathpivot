'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCodeProblem } from '@/app/actions/code-problems';

export function CodeProblemManager() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createCodeProblem(formData);
    if (!result.success) setError(result.error || 'Failed');
    else setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 mb-4">
        {showForm ? 'Cancel' : 'New Problem'}
      </button>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-slate-900 mb-3">Create Code Problem</h3>
          <form action={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Title *</label>
                <input type="text" name="title" required placeholder="Two Sum" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Difficulty</label>
                <select name="difficulty" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Language</label>
                <select name="language" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="r">R</option>
                  <option value="sql">SQL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Topic</label>
                <input type="text" name="topic" placeholder="recursion, sorting, etc." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Time Limit (ms)</label>
                <input type="number" name="timeLimitMs" defaultValue="5000" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Description *</label>
              <textarea name="description" required rows={4} placeholder="Problem description in markdown..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Starter Code</label>
              <textarea name="starterCode" rows={3} placeholder="def solution(nums):" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Solution Code (admin only)</label>
              <textarea name="solutionCode" rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Test Cases (JSON array)</label>
              <textarea name="testCases" rows={3} placeholder='[{"input": "1 2 3", "expected_output": "6", "is_hidden": false}]' className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              Create Problem
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
