import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "googleapis",
    "twilio",
    "stripe",
    "@anthropic-ai/sdk",
    "resend",
    "ical-generator",
  ],

  async redirects() {
    // /enroll/elite was the launch URL for the Sprint 9 pricing tier that has
    // since been renamed to Advanced. 301 keeps SEO, bookmarks, and any old
    // flyer / share links working.
    return [
      {
        source: "/enroll/elite",
        destination: "/enroll/advanced",
        permanent: true,
      },
      {
        source: "/enroll/elite/:path*",
        destination: "/enroll/advanced/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
                {
                  key: "Content-Security-Policy-Report-Only",
                  value: [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live",
                    "style-src 'self' 'unsafe-inline'",
                    "img-src 'self' data: blob: https://*.supabase.co",
                    "font-src 'self' data:",
                    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io https://vercel.live",
                    "frame-src https://js.stripe.com https://hooks.stripe.com https://vercel.live",
                    "object-src 'none'",
                    "base-uri 'self'",
                  ].join("; "),
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
