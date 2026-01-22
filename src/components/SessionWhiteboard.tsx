'use client';

import { useCallback, useRef, useState } from 'react';
import { Tldraw, Editor, TLEditorSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';

interface SessionWhiteboardProps {
  sessionId: string;
  readonly?: boolean;
}

export function SessionWhiteboard({ sessionId, readonly = false }: SessionWhiteboardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load snapshot from localStorage
  const getSnapshot = useCallback((): TLEditorSnapshot | undefined => {
    try {
      const localData = localStorage.getItem(`whiteboard-${sessionId}`);
      if (localData) {
        return JSON.parse(localData) as TLEditorSnapshot;
      }
    } catch (err) {
      console.error('Failed to load whiteboard snapshot:', err);
    }
    return undefined;
  }, [sessionId]);

  // Save whiteboard state with debouncing
  const saveWhiteboardState = useCallback(() => {
    if (!editorRef.current || readonly) return;

    setIsSaving(true);

    try {
      const snapshot = editorRef.current.getSnapshot();
      localStorage.setItem(`whiteboard-${sessionId}`, JSON.stringify(snapshot));
    } catch (err) {
      console.error('Failed to save whiteboard state:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [sessionId, readonly]);

  // Debounced save on changes
  const handleChange = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveWhiteboardState, 1000);
  }, [saveWhiteboardState]);

  // Clear whiteboard
  const handleClear = useCallback(() => {
    if (!editorRef.current) return;
    const allShapeIds = editorRef.current.getCurrentPageShapeIds();
    editorRef.current.deleteShapes([...allShapeIds]);
    saveWhiteboardState();
  }, [saveWhiteboardState]);

  // Get initial snapshot
  const initialSnapshot = getSnapshot();

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            Interactive Whiteboard
          </span>
          {isSaving && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          )}
        </div>
        {!readonly && (
          <button
            onClick={handleClear}
            className="text-xs px-3 py-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            Clear Board
          </button>
        )}
      </div>

      {/* Whiteboard Canvas */}
      <div className="w-full h-[500px] rounded-lg overflow-hidden border border-slate-200 shadow-inner">
        <Tldraw
          snapshot={initialSnapshot}
          onMount={(editor) => {
            editorRef.current = editor;
            // Listen for changes
            editor.store.listen(() => {
              handleChange();
            }, { source: 'user', scope: 'document' });
          }}
          hideUi={readonly}
        />
      </div>

      {/* Tips */}
      <div className="mt-2 px-2">
        <p className="text-xs text-slate-500">
          Use the tools above to draw, write equations, and explain concepts.
          Changes are saved automatically.
        </p>
      </div>
    </div>
  );
}
