import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "googleapis",
    "twilio",
    "stripe",
    "@anthropic-ai/sdk",
    "resend",
    "ical-generator",
  ],

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
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
                    "style-src 'self' 'unsafe-inline'",
                    "img-src 'self' data: blob: https://*.supabase.co",
                    "font-src 'self' data:",
                    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io",
                    "frame-src https://js.stripe.com https://hooks.stripe.com",
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

export default nextConfig;
