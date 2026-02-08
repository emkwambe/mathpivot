'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { Whiteboard } from '@/types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawElement = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawAPI = any;

// Dynamic import for SSR compatibility - Excalidraw requires browser APIs
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading whiteboard...
        </div>
      </div>
    )
  }
);

interface SessionWhiteboardProps {
  sessionId: string;
  readonly?: boolean;
}

interface WhiteboardData {
  elements: ExcalidrawElement[];
}

// Common LaTeX templates
const LATEX_TEMPLATES = [
  { label: 'Fraction', latex: '\\frac{a}{b}' },
  { label: 'Square Root', latex: '\\sqrt{x}' },
  { label: 'Exponent', latex: 'x^{n}' },
  { label: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' },
  { label: 'Pythagorean', latex: 'a^2 + b^2 = c^2' },
  { label: 'Sum', latex: '\\sum_{i=1}^{n} x_i' },
  { label: 'Integral', latex: '\\int_{a}^{b} f(x) \\, dx' },
  { label: 'Derivative', latex: '\\frac{dy}{dx}' },
];

export function SessionWhiteboard({ sessionId, readonly = false }: SessionWhiteboardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<WhiteboardData | null>(null);
  const [desmosExpanded, setDesmosExpanded] = useState(false);

  // Library modal state
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryWhiteboards, setLibraryWhiteboards] = useState<Whiteboard[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');

  // Equation modal state
  const [showEquationModal, setShowEquationModal] = useState(false);
  const [latexInput, setLatexInput] = useState('');
  const [latexError, setLatexError] = useState<string | null>(null);

  const excalidrawRef = useRef<ExcalidrawAPI | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const versionRef = useRef<number>(1);
  const supabase = createClient();

  // Load from Supabase on mount
  useEffect(() => {
    async function loadWhiteboard() {
      try {
        const { data, error } = await supabase
          .from('session_whiteboards')
          .select('elements, version')
          .eq('session_id', sessionId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Failed to load whiteboard:', error);
        }

        if (data) {
          versionRef.current = data.version;
          setInitialData({ elements: data.elements || [] });
        } else {
          setInitialData({ elements: [] });
        }
      } catch (err) {
        console.error('Failed to load whiteboard:', err);
        setInitialData({ elements: [] });
      }
    }

    loadWhiteboard();
  }, [sessionId, supabase]);

  // Save whiteboard state to Supabase
  const saveWhiteboardState = useCallback(async (elements: readonly ExcalidrawElement[]) => {
    if (readonly) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const newVersion = versionRef.current + 1;

      const { error } = await supabase
        .from('session_whiteboards')
        .upsert(
          {
            session_id: sessionId,
            elements: elements as ExcalidrawElement[],
            version: newVersion,
          },
          {
            onConflict: 'session_id',
          }
        );

      if (error) {
        console.error('Failed to save whiteboard:', error);
        setSaveError('Failed to save');
      } else {
        versionRef.current = newVersion;
      }
    } catch (err) {
      console.error('Failed to save whiteboard:', err);
      setSaveError('Failed to save');
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [sessionId, readonly, supabase]);

  // Debounced onChange handler
  const handleChange = useCallback((elements: readonly ExcalidrawElement[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveWhiteboardState(elements), 1000);
  }, [saveWhiteboardState]);

  // Clear whiteboard
  const handleClear = useCallback(async () => {
    if (excalidrawRef.current) {
      excalidrawRef.current.updateScene({ elements: [] });
      await saveWhiteboardState([]);
    }
  }, [saveWhiteboardState]);

  // Load whiteboards from library
  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('whiteboards')
        .select('*')
        .eq('tutor_user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to load library:', error);
      } else {
        setLibraryWhiteboards(data || []);
      }
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      setLibraryLoading(false);
    }
  }, [supabase]);

  // Open library modal
  const openLibraryModal = useCallback(() => {
    setShowLibraryModal(true);
    loadLibrary();
  }, [loadLibrary]);

  // Load whiteboard from library into session
  const loadFromLibrary = useCallback(async (whiteboard: Whiteboard) => {
    if (!excalidrawRef.current) return;

    const currentElements = excalidrawRef.current.getSceneElements();

    // Merge library elements with current elements (append to existing)
    // Offset the new elements so they don't overlap
    const libraryElements = (whiteboard.elements || []).map((el: ExcalidrawElement, idx: number) => ({
      ...el,
      id: `lib-${whiteboard.id}-${idx}-${Date.now()}`,
      x: (el.x || 0) + (currentElements.length > 0 ? 50 : 0),
      y: (el.y || 0) + (currentElements.length > 0 ? 50 : 0),
    }));

    excalidrawRef.current.updateScene({
      elements: [...currentElements, ...libraryElements],
    });

    // Save immediately
    await saveWhiteboardState([...currentElements, ...libraryElements]);

    setShowLibraryModal(false);
  }, [saveWhiteboardState]);

  // Replace entire whiteboard with library content
  const replaceFromLibrary = useCallback(async (whiteboard: Whiteboard) => {
    if (!excalidrawRef.current) return;

    const libraryElements = (whiteboard.elements || []).map((el: ExcalidrawElement, idx: number) => ({
      ...el,
      id: `lib-${whiteboard.id}-${idx}-${Date.now()}`,
    }));

    excalidrawRef.current.updateScene({
      elements: libraryElements,
    });

    await saveWhiteboardState(libraryElements);
    setShowLibraryModal(false);
  }, [saveWhiteboardState]);

  // Filter library whiteboards
  const filteredWhiteboards = libraryWhiteboards.filter(wb =>
    wb.name.toLowerCase().includes(librarySearch.toLowerCase()) ||
    wb.description?.toLowerCase().includes(librarySearch.toLowerCase()) ||
    wb.tags?.some(tag => tag.toLowerCase().includes(librarySearch.toLowerCase()))
  );

  // LaTeX validation
  const validateLatex = useCallback((latex: string): boolean => {
    try {
      katex.renderToString(latex, { throwOnError: true });
      setLatexError(null);
      return true;
    } catch (err) {
      setLatexError((err as Error).message);
      return false;
    }
  }, []);

  const handleLatexChange = useCallback((value: string) => {
    setLatexInput(value);
    if (value.trim()) {
      validateLatex(value);
    } else {
      setLatexError(null);
    }
  }, [validateLatex]);

  // Insert equation
  const insertEquation = useCallback(() => {
    if (!latexInput.trim() || !excalidrawRef.current) return;
    if (!validateLatex(latexInput)) return;

    const api = excalidrawRef.current;
    const appState = api.getAppState();
    const centerX = appState.scrollX + appState.width / 2;
    const centerY = appState.scrollY + appState.height / 2;

    const newElement = {
      type: 'text',
      id: `equation-${Date.now()}`,
      x: centerX - 100,
      y: centerY - 20,
      width: 200,
      height: 40,
      text: latexInput,
      fontSize: 24,
      fontFamily: 1,
      textAlign: 'center',
      verticalAlign: 'middle',
      strokeColor: '#1e1e1e',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      roughness: 0,
      opacity: 100,
      angle: 0,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 100000),
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
    };

    const currentElements = api.getSceneElements();
    api.updateScene({ elements: [...currentElements, newElement] });

    setLatexInput('');
    setShowEquationModal(false);
  }, [latexInput, validateLatex]);

  const renderLatexPreview = useCallback(() => {
    if (!latexInput.trim()) return null;
    try {
      const html = katex.renderToString(latexInput, { throwOnError: false, displayMode: true });
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <span className="text-red-500 text-sm">Invalid LaTeX</span>;
    }
  }, [latexInput]);

  if (!initialData) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 text-slate-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading whiteboard...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Math Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          {/* Load from Library Button */}
          {!readonly && (
            <button
              onClick={openLibraryModal}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Load from Library
            </button>
          )}

          {/* Insert Equation Button */}
          {!readonly && (
            <button
              onClick={() => setShowEquationModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Insert Equation
            </button>
          )}

          {/* Desmos Toggle */}
          <button
            onClick={() => setDesmosExpanded(!desmosExpanded)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              desmosExpanded
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            {desmosExpanded ? 'Hide' : ''} Calculator
          </button>
        </div>

        {/* Save Status & Clear */}
        <div className="flex items-center gap-3">
          {isSaving && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          )}
          {saveError && !isSaving && (
            <span className="text-xs text-red-500">{saveError}</span>
          )}
          {!readonly && (
            <button
              onClick={handleClear}
              className="text-xs px-3 py-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              Clear Board
            </button>
          )}
        </div>
      </div>

      {/* Excalidraw Canvas */}
      <div className="w-full h-[500px] rounded-lg overflow-hidden border border-slate-200 shadow-inner bg-white">
        <Excalidraw
          excalidrawAPI={(api) => { excalidrawRef.current = api; }}
          initialData={initialData}
          onChange={handleChange}
          viewModeEnabled={readonly}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              export: { saveFileToDisk: true },
              saveAsImage: true,
            },
          }}
          theme="light"
        />
      </div>

      {/* Desmos Graphing Calculator */}
      {desmosExpanded && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <span className="font-medium text-slate-700">Desmos Graphing Calculator</span>
            </div>
            <button onClick={() => setDesmosExpanded(false)} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <iframe
            src="https://www.desmos.com/calculator"
            className="w-full h-[400px]"
            title="Desmos Graphing Calculator"
            allow="clipboard-write"
            loading="lazy"
          />
        </div>
      )}

      {/* Library Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Load from Whiteboard Library</h3>
                <p className="text-sm text-slate-500">Select a whiteboard to load into this session</p>
              </div>
              <button
                onClick={() => setShowLibraryModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-slate-200 shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="Search whiteboards..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Whiteboard List */}
            <div className="flex-1 overflow-y-auto p-6">
              {libraryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="w-6 h-6 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : filteredWhiteboards.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <p className="text-slate-500">
                    {librarySearch ? 'No whiteboards match your search' : 'No whiteboards in your library yet'}
                  </p>
                  <a
                    href="/tutor/whiteboards/new"
                    target="_blank"
                    className="inline-block mt-4 text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    Create your first whiteboard →
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredWhiteboards.map((whiteboard) => (
                    <div
                      key={whiteboard.id}
                      className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                      <h4 className="font-medium text-slate-900 truncate">{whiteboard.name}</h4>
                      {whiteboard.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mt-1">{whiteboard.description}</p>
                      )}
                      {whiteboard.tags && whiteboard.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {whiteboard.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => loadFromLibrary(whiteboard)}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                        >
                          Add to Canvas
                        </button>
                        <button
                          onClick={() => replaceFromLibrary(whiteboard)}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded transition-colors"
                        >
                          Replace Canvas
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Equation Modal */}
      {showEquationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Insert Math Equation</h3>
              <button
                onClick={() => { setShowEquationModal(false); setLatexInput(''); setLatexError(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quick Templates</label>
                <div className="flex flex-wrap gap-2">
                  {LATEX_TEMPLATES.map((template) => (
                    <button
                      key={template.label}
                      onClick={() => { setLatexInput(template.latex); validateLatex(template.latex); }}
                      className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">LaTeX Expression</label>
                <textarea
                  value={latexInput}
                  onChange={(e) => handleLatexChange(e.target.value)}
                  placeholder="Enter LaTeX, e.g., \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
                {latexError && <p className="mt-1 text-xs text-red-500">{latexError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preview</label>
                <div className="min-h-[60px] p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
                  {latexInput.trim() ? renderLatexPreview() : <span className="text-slate-400 text-sm">Enter LaTeX to see preview</span>}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowEquationModal(false); setLatexInput(''); setLatexError(null); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={insertEquation}
                disabled={!latexInput.trim() || !!latexError}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert Equation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
