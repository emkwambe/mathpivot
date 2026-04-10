'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { importStudentsCSV, importTutorsCSV, exportStudentsCSV, exportTutorsCSV, exportSessionsCSV } from '@/app/actions/csv-import';

export function ImportManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleImport(formData: FormData, type: 'students' | 'tutors') {
    setLoading(true);
    setResult(null);

    const importFn = type === 'students' ? importStudentsCSV : importTutorsCSV;
    const res = await importFn(formData);

    if (res.success) {
      setResult({
        type: 'success',
        message: `Imported ${res.processed} ${type}${res.errors?.length ? `. ${res.errors.length} errors.` : '.'}`,
      });
    } else {
      setResult({ type: 'error', message: res.error || 'Import failed' });
    }

    setLoading(false);
    router.refresh();
  }

  async function handleExport(type: 'students' | 'tutors' | 'sessions') {
    setLoading(true);
    let csv: string = '';

    if (type === 'students') {
      const res = await exportStudentsCSV();
      csv = res.csv;
    } else if (type === 'tutors') {
      const res = await exportTutorsCSV();
      csv = res.csv;
    } else {
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const res = await exportSessionsCSV(monthAgo.toISOString(), now.toISOString());
      csv = res.csv;
    }

    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mathpivot-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {result && (
        <div className={`rounded-lg p-3 ${result.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm ${result.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{result.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Import Students */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-slate-900 mb-1">Import Students</h3>
          <p className="text-xs text-slate-500 mb-3">CSV: full_name, email, grade, course_track, parent_email</p>
          <form action={(fd) => handleImport(fd, 'students')}>
            <input type="file" name="file" accept=".csv" required className="text-sm mb-2 w-full" />
            <button type="submit" disabled={loading} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 w-full">
              {loading ? 'Importing...' : 'Import Students'}
            </button>
          </form>
        </div>

        {/* Import Tutors */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-slate-900 mb-1">Import Tutors</h3>
          <p className="text-xs text-slate-500 mb-3">CSV: full_name, email, specialties (;sep), hourly_rate</p>
          <form action={(fd) => handleImport(fd, 'tutors')}>
            <input type="file" name="file" accept=".csv" required className="text-sm mb-2 w-full" />
            <button type="submit" disabled={loading} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 w-full">
              {loading ? 'Importing...' : 'Import Tutors'}
            </button>
          </form>
        </div>
      </div>

      {/* Export */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Export Data</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleExport('students')} disabled={loading} className="border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
            Export Students CSV
          </button>
          <button onClick={() => handleExport('tutors')} disabled={loading} className="border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
            Export Tutors CSV
          </button>
          <button onClick={() => handleExport('sessions')} disabled={loading} className="border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
            Export Sessions CSV (30 days)
          </button>
        </div>
      </div>
    </div>
  );
}
