"use client";

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id, owner, device_name, next_maintenance_at, completion_pct, points, created_at')
        .order('created_at', { ascending: false });
      if (error) {
        console.error(error);
      } else {
        setReports(data as Report[]);
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Reports</h1>
      {loading ? (
        <p>Loading...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-400">No reports found.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="rounded border border-white/20 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium">{r.owner ?? 'Unknown'} — {r.device_name ?? 'Device'}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleString()} • {r.completion_pct ?? 0}% • {r.points ?? 0} pts
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
