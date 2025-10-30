"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// Define a type for tasks
type Task = {
  id: string;
  title: string;
  category: string;
  help?: string;
  link?: string;
  done: boolean;
  note?: string;
};

// A list of default maintenance tasks. These mirror the checklist discussed
// earlier and can be customised per organisation.
const defaultTasks: Task[] = [
  {
    id: 'startup_apps',
    title: 'Review startup applications',
    category: 'Startup',
    help: 'Disable non‑essential apps that auto‑launch.',
    link: 'https://support.microsoft.com/en-us/windows/change-which-apps-run-automatically-at-startup-in-windows-11-1882a1f1-9d5a-3eea-8e04-700e3a8f9425',
    done: false,
  },
  {
    id: 'clear_cache',
    title: 'Clear cache & temporary files',
    category: 'Storage',
    help: 'Use Disk Cleanup or Storage Management.',
    done: false,
  },
  {
    id: 'local_storage',
    title: 'Audit local storage (.csv exports, media)',
    category: 'Storage',
    help: 'Archive or delete large, old files.',
    done: false,
  },
  {
    id: 'camera_test',
    title: 'Test camera & mic performance',
    category: 'Hardware',
    help: 'Check focus, colour, lag in your meeting app.',
    done: false,
  },
  {
    id: 'user_habits',
    title: 'Confirm weekly full shutdown habit',
    category: 'Other',
    help: 'Power off at least once/week for updates.',
    done: false,
  },
  {
    id: 'battery_report',
    title: 'Generate & review battery report (uptime, cycles)',
    category: 'Power',
    help: 'Windows: powercfg /batteryreport | macOS: System Information > Power.',
    done: false,
  },
  {
    id: 'installed_apps',
    title: 'Audit installed apps (AV/bloatware)',
    category: 'Security',
    help: 'Remove unused apps; check antivirus & firewall.',
    done: false,
  },
  {
    id: 'hibp',
    title: 'Run Have I Been Pwned check',
    category: 'Security',
    help: 'Check work/personal emails for breaches.',
    link: 'https://haveibeenpwned.com/',
    done: false,
  },
  {
    id: 'os_updates',
    title: 'Install OS updates & reboot',
    category: 'Updates',
    done: false,
  },
  {
    id: 'driver_fw',
    title: 'Update drivers/firmware (graphics, BIOS)',
    category: 'Updates',
    done: false,
  },
  {
    id: 'app_updates',
    title: 'Update key applications',
    category: 'Updates',
    done: false,
  },
];

export default function Page() {
  // Local state for tasks, owner, device and next maintenance date
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [owner, setOwner] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [nextMaintenanceAt, setNextMaintenanceAt] = useState('');
  const [session, setSession] = useState<any>(null);
  // Track if the current user is an admin. null means unknown, false means not admin.
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Listen to auth changes so we can show the current user and restrict saving
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => {
      listener.subscription?.unsubscribe();
    };
  }, []);
  // When the session changes, look up the user's profile to determine if they are an admin.
  useEffect(() => {
    const checkAdmin = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        if (error) {
          console.error('Failed to fetch profile', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.is_admin ?? false);
        }
      } else {
        setIsAdmin(null);
      }
    };
    checkAdmin();
  }, [session]);

  // Derived progress metrics
  const completion = useMemo(() => {
    const done = tasks.filter((t) => t.done).length;
    const total = tasks.length;
    return {
      done,
      total,
      pct: total ? Math.round((done / total) * 100) : 0,
    };
  }, [tasks]);

  const points = useMemo(() => {
    return completion.done * 10 + (completion.pct === 100 ? 20 : 0);
  }, [completion]);

  // Toggle task completion
  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  // Update a task note
  const updateNote = (id: string, note: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, note } : t)));
  };

  // Save the current state as a report in Supabase
  const saveReport = async () => {
    if (!session?.user) {
      alert('You must sign in to save a report.');
      return;
    }
    try {
      // Insert report
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert([
          {
            user_id: session.user.id,
            device_id: null,
            owner: owner || session.user.email,
            device_name: deviceName || null,
            next_maintenance_at: nextMaintenanceAt
              ? new Date(nextMaintenanceAt).toISOString()
              : null,
            completion_pct: completion.pct,
            points: points,
          },
        ])
        .select()
        .single();
      if (reportError) throw reportError;
      const reportId = reportData.id;
      // Insert tasks
      const tasksPayload = tasks.map((t) => ({
        report_id: reportId,
        task_id: t.id,
        title: t.title,
        category: t.category,
        done: t.done,
        note: t.note ?? null,
      }));
      const { error: tasksError } = await supabase.from('report_tasks').insert(tasksPayload);
      if (tasksError) throw tasksError;
      alert('Report saved successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to save report');
    }
  };

  // OAuth sign in
  const signInWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
  };

  // Log out
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <header className="flex items-start md:items-center flex-col md:flex-row justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Maintenance Dashboard</h1>
          {session ? (
            <p className="text-sm text-gray-400">Signed in as {session.user.email}</p>
          ) : (
            <p className="text-sm text-gray-400">You are not signed in</p>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
            >
              Admin
            </Link>
          )}
          {session ? (
            <button
              onClick={signOut}
              className="px-3 py-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
            >
              Log out
            </button>
          ) : (
            <button
              onClick={signInWithGitHub}
              className="px-3 py-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:ring-1 hover:ring-fuchsia-500/40 transition"
            >
              Sign in with GitHub
            </button>
          )}
        </div>
      </header>

      {/* Owner, device and date fields */}
      <div className="grid gap-4 mb-6 md:grid-cols-3">
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 hover:ring-1 hover:ring-fuchsia-500/40 transition">
          <label className="block text-xs text-gray-400 mb-1">Owner</label>
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Your name"
            className="w-full bg-transparent border-b border-white/30 py-1 px-1 outline-none"
          />
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 hover:ring-1 hover:ring-fuchsia-500/40 transition">
          <label className="block text-xs text-gray-400 mb-1">Device Name</label>
          <input
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="Device name"
            className="w-full bg-transparent border-b border-white/30 py-1 px-1 outline-none"
          />
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 hover:ring-1 hover:ring-fuchsia-500/40 transition">
          <label className="block text-xs text-gray-400 mb-1">Next Maintenance Date</label>
          <input
            type="date"
            value={nextMaintenanceAt}
            onChange={(e) => setNextMaintenanceAt(e.target.value)}
            className="w-full bg-transparent border-b border-white/30 py-1 px-1 outline-none"
          />
        </div>
      </div>

      {/* Progress and points */}
      <div className="grid gap-4 mb-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 hover:ring-1 hover:ring-fuchsia-500/40 transition">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span>{completion.pct}%</span>
          </div>
          <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-3 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 shadow-[0_0_10px] shadow-fuchsia-500/40"
              style={{ width: `${completion.pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {completion.done} of {completion.total} tasks done
          </p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 hover:ring-1 hover:ring-fuchsia-500/40 transition">
          <div className="text-sm mb-2">Points & Badges</div>
          <div className="text-2xl font-bold mb-1">{points}</div>
          <div className="flex flex-wrap gap-2 text-xs">
            {completion.pct >= 30 && (
              <span className="px-2 py-1 border border-white/30 rounded-full">⚡ Starter</span>
            )}
            {completion.pct >= 60 && (
              <span className="px-2 py-1 border border-white/30 rounded-full">🧹 Optimiser</span>
            )}
            {completion.pct === 100 && (
              <span className="px-2 py-1 border border-white/30 rounded-full">🏅 All Clear</span>
            )}
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-4 mb-6">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 hover:ring-1 hover:ring-fuchsia-500/40 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                  className="h-5 w-5"
                />
                <div>
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-gray-400">{task.category}</div>
                </div>
              </div>
              {task.link && (
                <a
                  href={task.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline hover:text-fuchsia-300"
                >
                  Guide
                </a>
              )}
            </div>
            <textarea
              value={task.note || ''}
              onChange={(e) => updateNote(task.id, e.target.value)}
              placeholder="Notes..."
              className="mt-2 w-full bg-transparent border-b border-white/30 py-1 px-1 text-sm outline-none"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 mb-10">
        <button
          onClick={saveReport}
          className="px-5 py-2 rounded-2xl bg-white text-black hover:bg-gray-200 transition"
        >
          Save Report
        </button>
      </div>
    </div>
  );
}