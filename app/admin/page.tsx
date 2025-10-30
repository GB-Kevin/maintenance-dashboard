// This file defines the admin reports page with role-based access.
// It uses a hard-coded list of admin emails to grant administrative rights
// even before a profile record exists, and it removes the GitHub OAuth flow.
// Instead, users should log in via the custom email/password portal at /login.

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type Report = {
  id: string;
  owner: string | null;
  device_name: string | null;
  next_maintenance_at: string | null;
  completion_pct: number | null;
  points: number | null;
  created_at: string;
};

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  // Hard‑coded list of admin email addresses. Users with an email in this list are treated as admins.
  const ADMIN_EMAILS = ['kevin@getbetter.co.uk', 'tom@getbetter.co.uk'];

  // Fetch the current auth session and subscribe to changes. This keeps the `session`
  // state up to date as the user signs in or out.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => {
      listener.subscription?.unsubscribe();
    };
  }, []);

  // Determine whether the current user is an admin. First, check if their email
  // appears in the hard‑coded list. If not, look up their profile record to see
  // if they have the `is_admin` flag set.
  useEffect(() => {
    const checkAdmin = async () => {
      if (session?.user) {
        // Grant admin privileges if email matches one of the preconfigured addresses.
        if (ADMIN_EMAILS.includes(session.user.email)) {
          setIsAdmin(true);
          return;
        }
        // Otherwise, fetch the profile to check for an admin flag.
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        if (error) {
          console.error('Error fetching profile', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.is_admin ?? false);
        }
      } else {
        // No session means user is not signed in.
        setIsAdmin(null);
      }
    };
    checkAdmin();
  }, [session]);

  // Load all maintenance reports, sorted with the most recent first, when the user
  // has admin access. This will be triggered again if `isAdmin` changes.
  useEffect(() => {
    const fetchReports = async () => {
      if (isAdmin) {
        const { data, error } = await supabase
          .from('reports')
          .select(
            'id, owner, device_name, next_maintenance_at, completion_pct, points, created_at'
          )
          .order('created_at', { ascending: false });
        if (error) {
          console.error(error);
        } else {
          setReports(data as Report[]);
        }
        setLoading(false);
      }
    };
    if (isAdmin) {
      fetchReports();
    }
  }, [isAdmin]);

  // Log the current user out.
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Reports</h1>
        <div className="flex gap-2">
          {session ? (
            <button
              onClick={signOut}
              className="px-3 py-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3 py-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
            >
              Sign in
            </Link>
          )}
          <Link
            href="/"
            className="px-3 py-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
      {session === null || isAdmin === null ? (
        <p>Loading...</p>
      ) : !session ? (
        <p className="text-gray-300">
          You are not signed in.{" "}
          <Link href="/login" className="underline text-fuchsia-300">
            Sign in
          </Link>{" "}
          to continue.
        </p>
      ) : !isAdmin ? (
        <p className="text-gray-300">
          Access denied. You do not have admin privileges.
        </p>
      ) : loading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-300">No reports found.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 hover:ring-1 hover:ring-fuchsia-500/40 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium">
                    {r.owner ?? 'Unknown'} — {r.device_name ?? 'Device'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleString()} •{' '}
                    {r.completion_pct ?? 0}% • {r.points ?? 0} pts
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}