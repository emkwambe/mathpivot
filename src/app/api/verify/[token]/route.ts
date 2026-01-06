/**
 * Public Certification Verification API
 * GET /api/verify/[token] - Verify a certification by token
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyByToken } from '@/lib/certifications';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token required' },
        { status: 400 }
      );
    }

    // Get verifier info from headers
    const verifierInfo = {
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    };

    const result = await verifyByToken(token, verifierInfo);

    // Set appropriate cache headers
    const cacheControl = result.valid
      ? 'public, max-age=3600' // Cache valid results for 1 hour
      : 'no-cache'; // Don't cache invalid results

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/verify/[token] - Verify with verifier details
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const verifierInfo = {
      name: body.verifier_name,
      email: body.verifier_email,
      organization: body.verifier_organization,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    };

    const result = await verifyByToken(token, verifierInfo);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
