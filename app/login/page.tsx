"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// This page provides a standalone login portal for users to sign up or sign in
// using a one‑time password (OTP) sent to their email. Users enter their email,
// request a six‑digit code, and then enter the code to verify. This replaces the
// previous email/password and GitHub OAuth flows.

export default function LoginPage() {
  // Current authenticated session, if any.
  const [session, setSession] = useState<any>(null);
  // Email entered by the user when requesting a code.
  const [email, setEmail] = useState('');
  // Six‑digit code entered by the user after requesting a code.
  const [code, setCode] = useState('');
  // Indicates whether a code has been sent to the user's email.
  const [codeSent, setCodeSent] = useState(false);
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

  // Send an OTP code to the provided email. If the user doesn’t exist, Supabase
  // will create one automatically (shouldCreateUser defaults to true). Any errors
  // are captured and displayed to the user.
  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (signInError) {
      setError(signInError.message);
      return;
    }
    setCodeSent(true);
  };

  // Verify the OTP code entered by the user. Upon success, the session will
  // update and the user will be considered logged in. Errors are displayed.
  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    // Set the session (if returned) and reset local state on success.
    setSession(data?.session ?? null);
    setEmail('');
    setCode('');
    setCodeSent(false);
  };

  // Sign the user out and reset local state.
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setEmail('');
    setCode('');
    setCodeSent(false);
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
          {!codeSent ? (
            <form onSubmit={sendCode} className="space-y-4">
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
                Send code
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6‑digit code"
                maxLength={6}
                className="w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
                required
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
              >
                Verify code
              </button>
              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setCode('');
                  setError(null);
                }}
                className="w-full px-4 py-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
              >
                Back
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}