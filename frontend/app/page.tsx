'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

type Job = {
  id: number;
  taskName: string;
  payload: any;
  priority: string;
  status: string;
  webhookLog: string | null;
  createdAt: string;
};

const BACKEND_URL = 'http://localhost:5000';

export default function HomePage() {
  const [taskName, setTaskName] = useState('');
  const [payloadText, setPayloadText] = useState('{\n  "example": true\n}');
  const [priority, setPriority] = useState('Medium');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      setError(null);

      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const res = await axios.get<Job[]>(`${BACKEND_URL}/jobs`, { params });
      setJobs(res.data);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please check backend is running.');
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, priorityFilter]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!taskName.trim()) {
      setError('Task name is required.');
      return;
    }

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(payloadText);
    } catch (err) {
      setError('Payload must be valid JSON.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${BACKEND_URL}/jobs`, {
        taskName,
        payload: parsedPayload,
        priority,
      });

      setSuccess(`Job created with ID ${res.data.id}`);
      setTaskName('');
      setPayloadText('{\n  "example": true\n}');
      setPriority('Medium');

      fetchJobs();
    } catch (err: any) {
      console.error('Error creating job:', err);
      setError('Failed to create job. Please check backend.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunJob = async (id: number) => {
    setError(null);
    setSuccess(null);

    try {
      await axios.post(`${BACKEND_URL}/run-job/${id}`);
      setSuccess(`Job ${id} started.`);
      setJobs((prev) =>
        prev.map((job) =>
          job.id === id ? { ...job, status: 'running' } : job
        )
      );

      setTimeout(() => {
        fetchJobs();
      }, 4000);
    } catch (err: any) {
      console.error('Error running job:', err);
      setError('Failed to run job.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-2">Job Scheduler Dashboard</h1>
        <p className="text-slate-400 mb-6">
          Create jobs, monitor status, and trigger execution with a webhook callback.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-900/40 border border-red-500 px-4 py-2 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md bg-emerald-900/30 border border-emerald-500 px-4 py-2 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT: Job creation form */}
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-xl font-semibold mb-3">Create Job</h2>
            <form className="space-y-4" onSubmit={handleCreateJob}>
              <div>
                <label className="block text-sm mb-1">Task Name</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  placeholder="Send email, generate report..."
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Payload (JSON)</label>
                <textarea
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono outline-none focus:border-emerald-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  This will be sent to your worker/webhook as JSON.
                </p>
              </div>

              <div>
                <label className="block text-sm mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-60"
              >
                {submitting ? 'Creating...' : 'Create Job'}
              </button>
            </form>
          </section>

          {/* RIGHT: Jobs list */}
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Jobs</h2>
              <button
                onClick={fetchJobs}
                className="rounded-md border border-slate-700 px-3 py-1 text-xs hover:border-emerald-500"
              >
                Refresh
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs outline-none focus:border-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs outline-none focus:border-emerald-500"
              >
                <option value="all">All Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="border border-slate-800 rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-950/70">
                  <tr>
                    <th className="px-2 py-2 text-left">ID</th>
                    <th className="px-2 py-2 text-left">Task</th>
                    <th className="px-2 py-2 text-left">Priority</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Created</th>
                    <th className="px-2 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingJobs ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 py-4 text-center text-slate-400"
                      >
                        Loading jobs...
                      </td>
                    </tr>
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 py-4 text-center text-slate-400"
                      >
                        No jobs found. Create one using the form.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className="border-t border-slate-800">
                        <td className="px-2 py-2">{job.id}</td>
                        <td className="px-2 py-2">{job.taskName}</td>
                        <td className="px-2 py-2">{job.priority}</td>
                        <td className="px-2 py-2 capitalize">{job.status}</td>
                        <td className="px-2 py-2 text-xs">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => handleRunJob(job.id)}
                            disabled={job.status === 'running'}
                            className="rounded-md bg-blue-600 px-2 py-1 text-xs hover:bg-blue-500 disabled:opacity-50"
                          >
                            Run
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
