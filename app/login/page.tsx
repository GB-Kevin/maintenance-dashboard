// This page provides a standalone login portal for users to sign in with GitHub via Supabase.
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => {
      listener.subscription?.unsubscribe();
    };
  }, []);

  const signInWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome</h1>
      {session ? (
        <div className="space-y-4">
          <p className="text-lg">
            Signed in as <span className="font-medium">{session.user.email}</span>
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
            >
              Go to Admin
            </Link>
          </div>
          <button
            onClick={signOut}
            className="mt-4 px-4 py-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
          >
            Log out
          </button>
        </div>
      ) : (
        <button
          onClick={signInWithGitHub}
          className="px-6 py-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
        >
          Sign in with GitHub
        </button>
      )}
    </div>
  );
}
