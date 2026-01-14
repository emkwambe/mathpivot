import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: ComponentHealth;
    auth: ComponentHealth;
    storage?: ComponentHealth;
  };
  metadata?: Record<string, unknown>;
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms: number;
  message?: string;
}

const startTime = Date.now();

/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Returns system health status for monitoring
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const verbose = searchParams.get('verbose') === 'true';

  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database: { status: 'healthy', latency_ms: 0 },
      auth: { status: 'healthy', latency_ms: 0 },
    },
  };

  // Check database connectivity
  const dbCheck = await checkDatabase();
  result.checks.database = dbCheck;

  // Check auth service
  const authCheck = await checkAuth();
  result.checks.auth = authCheck;

  // Determine overall status
  const checks = Object.values(result.checks);
  if (checks.some(c => c.status === 'unhealthy')) {
    result.status = 'unhealthy';
  } else if (checks.some(c => c.status === 'degraded')) {
    result.status = 'degraded';
  }

  // Add verbose metadata
  if (verbose) {
    result.metadata = {
      node_env: process.env.NODE_ENV,
      region: process.env.VERCEL_REGION || 'local',
      memory_usage: process.memoryUsage ? process.memoryUsage() : undefined,
    };
  }

  // Return appropriate status code
  const statusCode = result.status === 'healthy' ? 200 :
                     result.status === 'degraded' ? 200 : 503;

  return NextResponse.json(result, { status: statusCode });
}

/**
 * Check database connectivity and latency
 */
async function checkDatabase(): Promise<ComponentHealth> {
  const startTime = performance.now();

  try {
    const supabase = await createClient();

    // Simple query to check connectivity
    const { error } = await supabase
      .from('users_profile')
      .select('id')
      .limit(1);

    const latency = Math.round(performance.now() - startTime);

    if (error) {
      return {
        status: 'unhealthy',
        latency_ms: latency,
        message: error.message,
      };
    }

    // Check latency thresholds
    if (latency > 1000) {
      return {
        status: 'degraded',
        latency_ms: latency,
        message: 'High latency detected',
      };
    }

    return {
      status: 'healthy',
      latency_ms: latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency_ms: Math.round(performance.now() - startTime),
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check auth service
 */
async function checkAuth(): Promise<ComponentHealth> {
  const startTime = performance.now();

  try {
    const supabase = await createClient();

    // Check if auth service responds
    const { error } = await supabase.auth.getSession();

    const latency = Math.round(performance.now() - startTime);

    if (error) {
      return {
        status: 'degraded',
        latency_ms: latency,
        message: error.message,
      };
    }

    return {
      status: 'healthy',
      latency_ms: latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency_ms: Math.round(performance.now() - startTime),
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
