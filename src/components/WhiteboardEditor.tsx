//src/app/(dashboard)/tutor/whiteboards/new/page.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { WhiteboardSidebar } from '@/components/WhiteboardSidebar';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawElement = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawAPI = any;

// Dynamic import for SSR compatibility
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-slate-50">
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

// LaTeX templates
const LATEX_TEMPLATES = [
  { label: 'Fraction', latex: '\\frac{a}{b}' },
  { label: 'Square Root', latex: '\\sqrt{x}' },
  { label: 'Quadratic', latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' },
  { label: 'Pythagorean', latex: 'a^2 + b^2 = c^2' },
  { label: 'Integral', latex: '\\int_{a}^{b} f(x) \\, dx' },
  { label: 'Sum', latex: '\\sum_{i=1}^{n} x_i' },
];

export default function NewWhiteboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [whiteboardId, setWhiteboardId] = useState<string | null>(null);

  // Equation modal
  const [showEquationModal, setShowEquationModal] = useState(false);
  const [latexInput, setLatexInput] = useState('');
  const [latexError, setLatexError] = useState<string | null>(null);

  const excalidrawRef = useRef<ExcalidrawAPI | null>(null);
  const elementsRef = useRef<ExcalidrawElement[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save function
  const saveWhiteboard = useCallback(async (elements: ExcalidrawElement[]) => {
    const currentName = name.trim() || 'Untitled whiteboard';

    setIsSaving(true);
    setSaveError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveError('Not logged in');
        return;
      }

      if (whiteboardId) {
        // Update existing
        const { error } = await supabase
          .from('whiteboards')
          .update({
            name: currentName,
            description: description || null,
            tags,
            is_public: isPublic,
            elements,
          })
          .eq('id', whiteboardId);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('whiteboards')
          .insert({
            tutor_user_id: user.id,
            name: currentName,
            description: description || null,
            tags,
            is_public: isPublic,
            elements,
          })
          .select('id')
          .single();

        if (error) throw error;
        if (data) {
          setWhiteboardId(data.id);
          // Update URL without navigation
          window.history.replaceState(null, '', `/tutor/whiteboards/${data.id}`);
        }
      }

      setLastSaved(new Date());
    } catch (err) {
      console.error('Failed to save:', err);
      setSaveError('Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [name, description, tags, isPublic, whiteboardId, supabase]);

  // Debounced save on element change
  const handleChange = useCallback((elements: readonly ExcalidrawElement[]) => {
    elementsRef.current = elements as ExcalidrawElement[];
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveWhiteboard(elementsRef.current);
    }, 2000);
  }, [saveWhiteboard]);

  // Save on metadata change
  useEffect(() => {
    if (whiteboardId) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveWhiteboard(elementsRef.current);
      }, 1000);
    }
  }, [name, description, tags, isPublic, whiteboardId, saveWhiteboard]);

  // Clear whiteboard
  const handleClear = useCallback(() => {
    if (excalidrawRef.current) {
      excalidrawRef.current.updateScene({ elements: [] });
      elementsRef.current = [];
    }
  }, []);

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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Bar */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/tutor/whiteboards"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-sm font-medium text-slate-600">
            {name || 'New Whiteboard'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Insert Equation */}
          <button
            onClick={() => setShowEquationModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Equation
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <WhiteboardSidebar
          name={name}
          onNameChange={setName}
          description={description}
          onDescriptionChange={setDescription}
          tags={tags}
          onTagsChange={setTags}
          isPublic={isPublic}
          onPublicChange={setIsPublic}
          isSaving={isSaving}
          lastSaved={lastSaved}
          saveError={saveError}
          isNewWhiteboard={true}
        />

        {/* Canvas Area - FIXED: Blank canvas, visible toolbar */}
        <div className="flex-1 relative bg-white">
          <div className="absolute inset-0">
            <Excalidraw
              excalidrawAPI={(api) => { excalidrawRef.current = api; }}
              onChange={handleChange}
              initialData={{
                elements: [],
                appState: {
                  viewBackgroundColor: "#ffffff",
                },
              }}
              theme="light"
            />
          </div>
        </div>
      </div>

      {/* Equation Modal */}
      {showEquationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Insert Equation</h3>
              <button onClick={() => { setShowEquationModal(false); setLatexInput(''); }} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {LATEX_TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => { setLatexInput(t.latex); validateLatex(t.latex); }}
                    className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <textarea
                value={latexInput}
                onChange={(e) => { setLatexInput(e.target.value); if (e.target.value) validateLatex(e.target.value); else setLatexError(null); }}
                placeholder="Enter LaTeX..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {latexError && <p className="text-xs text-red-500">{latexError}</p>}
              <div className="min-h-[50px] p-3 bg-slate-50 rounded-lg flex items-center justify-center">
                {latexInput ? renderLatexPreview() : <span className="text-slate-400 text-sm">Preview</span>}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => { setShowEquationModal(false); setLatexInput(''); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={insertEquation} disabled={!latexInput.trim() || !!latexError} className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">Insert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}