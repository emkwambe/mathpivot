import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import type { Whiteboard } from '@/types/database';
import { WhiteboardSortDropdown } from './WhiteboardSortDropdown';

interface PageProps {
  searchParams: Promise<{ search?: string; sort?: string }>;
}

export default async function TutorWhiteboardsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const searchQuery = params.search || '';
  const sort = params.sort || 'updated-desc';

  const user = await requireRole(['tutor', 'admin']);
  const supabase = await createClient();

  // Fetch tutor's whiteboards
  let query = supabase
    .from('whiteboards')
    .select('*')
    .eq('tutor_user_id', user.id);

  // Apply search filter
  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  // Apply sorting
  if (sort === 'name') {
    query = query.order('name', { ascending: true });
  } else if (sort === 'name-desc') {
    query = query.order('name', { ascending: false });
  } else if (sort === 'created') {
    query = query.order('created_at', { ascending: true });
  } else {
    // Default: updated-desc
    query = query.order('updated_at', { ascending: false });
  }

  const { data: whiteboards } = await query;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Whiteboard Library</h1>
          <p className="text-slate-600">Create and manage reusable whiteboard content</p>
        </div>
        <Link
          href="/tutor/whiteboards/new"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Whiteboard
        </Link>
      </div>

      {/* Search and Sort Bar */}
      <div className="flex items-center gap-4">
        <form className="flex-1 max-w-md">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Search whiteboards..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </form>

        <WhiteboardSortDropdown currentSort={sort} />
      </div>

      {/* Whiteboards Grid */}
      {whiteboards && whiteboards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {whiteboards.map((whiteboard: Whiteboard) => (
            <WhiteboardCard key={whiteboard.id} whiteboard={whiteboard} />
          ))}
        </div>
      ) : (
        <EmptyState searchQuery={searchQuery} />
      )}
    </div>
  );
}

function WhiteboardCard({ whiteboard }: { whiteboard: Whiteboard }) {
  return (
    <Link href={`/tutor/whiteboards/${whiteboard.id}`}>
      <div className="h-full p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
        {/* Preview placeholder */}
        <div className="h-32 bg-slate-50 rounded-lg mb-4 flex items-center justify-center border border-slate-100">
          <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-900 truncate">{whiteboard.name}</h3>

        {/* Description */}
        {whiteboard.description && (
          <p className="text-sm text-slate-500 line-clamp-2 mt-1">{whiteboard.description}</p>
        )}

        {/* Tags */}
        {whiteboard.tags && whiteboard.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {whiteboard.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full"
              >
                {tag}
              </span>
            ))}
            {whiteboard.tags.length > 3 && (
              <span className="text-xs px-2 py-0.5 text-slate-400">
                +{whiteboard.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Updated {formatDate(whiteboard.updated_at, 'MMM d, yyyy')}
          </p>
          {whiteboard.is_public && (
            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">
              Public
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-12">
      <div className="text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        {searchQuery ? (
          <>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Results Found</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-4">
              No whiteboards match &quot;{searchQuery}&quot;. Try a different search term.
            </p>
            <Link
              href="/tutor/whiteboards"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear search
            </Link>
          </>
        ) : (
          <>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Whiteboards Yet</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-4">
              Create your first whiteboard to prepare lessons and reuse content across sessions.
            </p>
            <Link
              href="/tutor/whiteboards/new"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Your First Whiteboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
