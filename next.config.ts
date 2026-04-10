import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude heavy server-only packages from client bundle
  serverExternalPackages: [
    'googleapis',
    'twilio',
    'stripe',
    '@anthropic-ai/sdk',
    'resend',
    'ical-generator',
  ],
};

export default nextConfig;
