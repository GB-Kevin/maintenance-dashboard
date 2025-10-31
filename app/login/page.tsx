"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// This page provides a standalone login portal for users to sign up or sign in
// using a magic link sent to their email. Users enter their email and request
// a sign‑in link. Supabase will send them a unique URL they can click to
// authenticate. This flow replaces the previous one‑time password (OTP) flow.

export default function LoginPage() {
  // Current authenticated session, if any.
  const [session, setSession] = useState<any>(null);
  // Email entered by the user.
  const [email, setEmail] = useState('');
  // Indicates whether a link has been sent to the user's email.
  const [linkSent, setLinkSent] = useState(false);
  // Holds any error message returned from Supabase.
  const [error, setError] = useState<string | null>(null);

  // Synchronize local session state with Supabase auth events.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => {
      listener.subscription?.unsubscribe();
    };
  }, []);

  // Send a magic sign‑in link to the provided email. If the user doesn’t exist,
  // Supabase will create one automatically (shouldCreateUser defaults to true).
  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // Redirect users back to your site after they click the link. You can
        // customize this via NEXT_PUBLIC_SUPABASE_REDIRECT or NEXT_PUBLIC_SITE_URL.
        emailRedirectTo: process.env.NEXT_PUBLIC_SUPABASE_REDIRECT || process.env.NEXT_PUBLIC_SITE_URL || undefined,
      },
    });
    if (signInError) {
      setError(signInError.message);
      return;
    }
    setLinkSent(true);
  };

  // Sign the user out and reset local state.
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setEmail('');
    setLinkSent(false);
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
        <div className="w-full max-w-sm mx-auto space-y-4">
          {!linkSent ? (
            <form onSubmit={sendLink} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
                required
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
              >
                Send sign‑in link
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p>
                We’ve sent a link to <span className="font-medium">{email}</span>. Please
                check your email and click the link to continue.
              </p>
              <button
                type="button"
                onClick={() => {
                  setLinkSent(false);
                  setError(null);
                }}
                className="w-full px-4 py-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
              >
                Back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}