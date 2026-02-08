'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface WhiteboardSidebarProps {
  // Form fields
  name: string;
  onNameChange: (name: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  isPublic: boolean;
  onPublicChange: (isPublic: boolean) => void;

  // Metadata (optional, for existing whiteboards)
  createdAt?: string;
  updatedAt?: string;
  sessionCount?: number;

  // Save status
  isSaving: boolean;
  lastSaved?: Date | null;
  saveError?: string | null;

  // Mode
  isNewWhiteboard?: boolean;
}

export function WhiteboardSidebar({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  tags,
  onTagsChange,
  isPublic,
  onPublicChange,
  createdAt,
  updatedAt,
  sessionCount,
  isSaving,
  lastSaved,
  saveError,
  isNewWhiteboard = false,
}: WhiteboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDescription, setShowDescription] = useState(!!description);
  const [tagInput, setTagInput] = useState('');
  const [lastEditedText, setLastEditedText] = useState('');

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('whiteboard-sidebar-collapsed');
    if (saved === 'true') setIsCollapsed(true);
  }, []);

  // Save collapsed state
  const toggleCollapsed = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('whiteboard-sidebar-collapsed', String(newState));
  }, [isCollapsed]);

  // Update "last edited" text every minute
  useEffect(() => {
    const updateLastEdited = () => {
      if (updatedAt) {
        setLastEditedText(formatDistanceToNow(new Date(updatedAt), { addSuffix: true }));
      } else if (lastSaved) {
        setLastEditedText(formatDistanceToNow(lastSaved, { addSuffix: true }));
      }
    };

    updateLastEdited();
    const interval = setInterval(updateLastEdited, 60000);
    return () => clearInterval(interval);
  }, [updatedAt, lastSaved]);

  // Add tag on Enter or comma
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,/g, '');
      if (newTag && !tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-4 shrink-0">
        <button
          onClick={toggleCollapsed}
          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>

        {/* Collapsed save status */}
        <div className="mt-4">
          {isSaving ? (
            <svg className="w-4 h-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : saveError ? (
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : lastSaved ? (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header with collapse button */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-slate-700">Whiteboard Details</span>
        <button
          onClick={toggleCollapsed}
          className="p-1.5 hover:bg-slate-200 rounded transition-colors"
          title="Collapse sidebar"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Whiteboard Info Section */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Untitled whiteboard"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-indigo-900"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tag, press Enter"
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
          </div>

          {/* Description (Collapsible) */}
          <div>
            {!showDescription ? (
              <button
                onClick={() => setShowDescription(true)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Add description...
              </button>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Description
                  </label>
                  <button
                    onClick={() => {
                      setShowDescription(false);
                      onDescriptionChange('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="Add notes about this whiteboard..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200" />

        {/* Metadata Section */}
        <div className="p-4 space-y-3">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Info</h3>

          {/* Auto-save status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Auto-save</span>
            <span className="text-xs">
              {isSaving ? (
                <span className="text-slate-500 flex items-center gap-1">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : saveError ? (
                <span className="text-red-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Error
                </span>
              ) : lastSaved || !isNewWhiteboard ? (
                <span className="text-green-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </span>
              ) : (
                <span className="text-slate-400">Not saved yet</span>
              )}
            </span>
          </div>

          {/* Last edited */}
          {lastEditedText && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Last edited</span>
              <span className="text-xs text-slate-600">{lastEditedText}</span>
            </div>
          )}

          {/* Created date */}
          {createdAt && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Created</span>
              <span className="text-xs text-slate-600">
                {new Date(createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Session count */}
          {sessionCount !== undefined && sessionCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Used in</span>
              <span className="text-xs text-slate-600">{sessionCount} session{sessionCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200" />

        {/* Sharing Section */}
        <div className="p-4">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Sharing</h3>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => onPublicChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm text-slate-700">Make public</span>
              <p className="text-xs text-slate-500 mt-0.5">
                Other tutors can view and copy
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
