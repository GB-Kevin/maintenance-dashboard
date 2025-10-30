"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// This page provides a standalone login portal for users to sign up or sign in
// using an email and password. It replaces the GitHub OAuth flow.

export default function LoginPage() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);

  // Keep the session state in sync with Supabase auth events.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => {
      listener.subscription?.unsubscribe();
    };
  }, []);

  // Handle sign‑in or sign‑up depending on the current mode. Any errors are captured
  // and displayed below the form.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
    }
    // Clear form on successful submission
    setEmail('');
    setPassword('');
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
        <div className="w-full max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
              required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
            >
              {mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </form>
          <div className="mt-4 text-sm">
            {mode === 'signin' ? (
              <>
                Don’t have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="underline text-fuchsia-300"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="underline text-fuchsia-300"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}