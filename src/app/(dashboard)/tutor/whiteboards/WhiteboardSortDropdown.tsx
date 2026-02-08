'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface WhiteboardSortDropdownProps {
  currentSort: string;
}

export function WhiteboardSortDropdown({ currentSort }: WhiteboardSortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    router.push(`/tutor/whiteboards?${params.toString()}`);
  };

  return (
    <select
      value={currentSort}
      onChange={handleSortChange}
      className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
    >
      <option value="updated-desc">Recently Updated</option>
      <option value="name">Name (A-Z)</option>
      <option value="name-desc">Name (Z-A)</option>
      <option value="created">Oldest First</option>
    </select>
  );
}
