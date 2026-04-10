import { createClient } from '@/lib/supabase/server';
import LandingPageClient from './landing-page-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MathPivot – The Operating System for Tutoring Centers',
  description: 'Schedule sessions, track mastery, bill parents, and power AI-assisted learning — all in one platform for math and CS education.',
  openGraph: {
    images: ['/og-image.png'],
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return <LandingPageClient isLoggedIn={isLoggedIn} />;
}
