'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export type SortOption = 'name' | 'name-desc' | 'level' | 'level-desc' | 'difficulty' | 'difficulty-desc' | 'hours' | 'hours-desc';

interface SortDropdownProps {
  currentSort?: SortOption;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'level', label: 'Level (Beginner first)' },
  { value: 'level-desc', label: 'Level (Advanced first)' },
  { value: 'difficulty', label: 'Difficulty (Easy first)' },
  { value: 'difficulty-desc', label: 'Difficulty (Hard first)' },
  { value: 'hours', label: 'Duration (Shortest first)' },
  { value: 'hours-desc', label: 'Duration (Longest first)' },
];

export function SortDropdown({ currentSort = 'name' }: SortDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value as SortOption;
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-slate-600">
        Sort by:
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={handleSortChange}
        className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
