'use client';

import { SessionWhiteboard } from '@/components/SessionWhiteboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export default function WhiteboardTestPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Whiteboard Test</h1>
        <p className="text-slate-600">Test the tldraw whiteboard component</p>
      </div>

      {/* Whiteboard */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Whiteboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] border border-slate-200 rounded-lg overflow-hidden">
            <SessionWhiteboard sessionId="test-session" readonly={false} />
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li>Freehand drawing with pen tool</li>
            <li>Shape tools (rectangle, ellipse, arrow, line)</li>
            <li>Text annotations</li>
            <li>Selection and move tools</li>
            <li>Eraser tool</li>
            <li>Auto-saves to localStorage</li>
            <li>Undo/Redo support</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
