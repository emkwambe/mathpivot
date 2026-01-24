import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Chat API is working',
    timestamp: new Date().toISOString()
  });
}
