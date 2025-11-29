'use client';

import { useEffect, useState, useMemo, useCallback, ElementType } from 'react';
import axios from 'axios';
import { Play, RotateCw, Plus, Cpu, Clock, Zap, AlertTriangle, CheckCircle, Database, Sun, Moon } from 'lucide-react'; 

// --- Types & Constants ---
type Job = {
  id: number;
  taskName: string;
  payload: any;
  priority: 'Low' | 'Medium' | 'High';
  status: 'pending' | 'running' | 'completed' | 'failed'; 
  webhookLog: string | null;
  createdAt: string;
};

const BACKEND_URL = 'http://localhost:5000';

// --- Utility Components for Status and Priority Chips ---

const StatusChip: React.FC<{ status: Job['status']; darkMode: boolean }> = ({ status, darkMode }) => {
  // Dark mode primary accent is now white
  const accentColorDark = 'text-white'; 
  
  const statusConfig = useMemo(() => {
    const baseClasses = 'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase border';
    
    if (darkMode) {
      switch (status) {
        case 'pending':
          return { text: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-500/50', dot: 'bg-yellow-400', class: baseClasses };
        case 'running':
          // Bright White/Gray accent color for Running state in Dark Mode
          return { text: 'Running', color: accentColorDark, bg: 'bg-white/10', border: 'border-white/50', dot: 'bg-white animate-pulse', class: baseClasses };
        case 'completed':
          return { text: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-500/50', dot: 'bg-emerald-400', class: baseClasses };
        case 'failed':
          return { text: 'Failed', color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50', dot: 'bg-red-400', class: baseClasses };
        default:
          return { text: status, color: 'text-slate-400', bg: 'bg-slate-700/15', border: 'border-slate-700/40', dot: 'bg-slate-400', class: baseClasses };
      }
    } else { // Light mode specific colors
      switch (status) {
        case 'pending':
          return { text: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300', dot: 'bg-yellow-500', class: baseClasses };
        case 'running':
          return { text: 'Running', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300', dot: 'bg-blue-500 animate-pulse', class: baseClasses };
        case 'completed':
          return { text: 'Completed', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300', dot: 'bg-green-500', class: baseClasses };
        case 'failed':
          return { text: 'Failed', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', dot: 'bg-red-500', class: baseClasses };
        default:
          return { text: status, color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-300', dot: 'bg-gray-500', class: baseClasses };
      }
    }
  }, [status, darkMode, accentColorDark]);

  return (
    <span
      className={`${statusConfig.class} ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
    >
      <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
      {statusConfig.text}
    </span>
  );
};

const PriorityChip: React.FC<{ priority: Job['priority']; darkMode: boolean }> = ({ priority, darkMode }) => {
  const priorityConfig = useMemo(() => {
    if (darkMode) {
      switch (priority) {
        case 'Low':
          return { color: 'text-green-400' };
        case 'Medium':
          return { color: 'text-yellow-400' };
        case 'High':
          return { color: 'text-red-400' };
        default:
          return { color: 'text-slate-400' };
      }
    } else { // Light mode
      switch (priority) {
        case 'Low':
          return { color: 'text-green-700' };
        case 'Medium':
          return { color: 'text-yellow-700' };
        case 'High':
          return { color: 'text-red-700' };
        default:
          return { color: 'text-gray-700' };
      }
    }
  }, [priority, darkMode]);

  return (
    <span className={`inline-flex items-center text-sm font-semibold ${priorityConfig.color}`}>
      {priority}
    </span>
  );
};


// --- Job Stats Component ---

interface StatCardProps {
    icon: ElementType; 
    title: string;
    value: number;
    color: string;
    darkMode: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, color, darkMode }) => {
    // Card styling with hover for "enhance up" effect
    const baseClasses = 'p-5 rounded-xl border transition-all duration-300 ease-in-out';
    
    // Dark mode: Focus on black/gray contrast with bright white hover/glow
    const darkClasses = 'bg-slate-900/60 border-slate-700 shadow-inner shadow-black/80 hover:scale-[1.01] hover:shadow-lg hover:shadow-white/10';
    
    // Light mode: Uses white over bg-gray-100, subtle hover
    const lightClasses = 'bg-white border-gray-200 shadow-md shadow-gray-200/50 hover:scale-[1.01] hover:shadow-lg hover:shadow-gray-300/30';
    
    const iconBg = darkMode ? 'bg-slate-800/50' : 'bg-gray-100';

    return (
        <div className={`${baseClasses} ${darkMode ? darkClasses : lightClasses}`}>
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${color} ${iconBg}`}>
                    <Icon className="w-6 h-6" /> 
                </div>
                <p className={`text-3xl font-extrabold ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}> 
                    {value}
                </p>
            </div>
            <p className={`text-lg font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-600'} mt-2`}>{title}</p>
        </div>
    );
};

const JobStats: React.FC<{ jobs: Job[]; darkMode: boolean }> = ({ jobs, darkMode }) => {
  const totalJobs = jobs.length;
  const runningJobs = jobs.filter(j => j.status === 'running').length;
  const pendingJobs = jobs.filter(j => j.status === 'pending').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  
  // Running job icon color is white in dark mode
  const accentColorRunning = darkMode ? 'text-white' : 'text-blue-500';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"> 
      <StatCard icon={Database} title="Total Jobs" value={totalJobs} color={darkMode ? 'text-slate-400' : 'text-gray-600'} darkMode={darkMode} />
      <StatCard icon={Zap} title="Running" value={runningJobs} color={accentColorRunning} darkMode={darkMode} />
      <StatCard icon={Clock} title="Pending" value={pendingJobs} color={darkMode ? 'text-yellow-500' : 'text-yellow-600'} darkMode={darkMode} />
      <StatCard icon={CheckCircle} title="Completed" value={completedJobs} color={darkMode ? 'text-emerald-500' : 'text-green-600'} darkMode={darkMode} />
    </div>
  );
};


// --- Main Component ---

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode (true black)
  const [taskName, setTaskName] = useState('');
  const [payloadText, setPayloadText] = useState('{\n  "example": true\n}');
  const [priority, setPriority] = useState<Job['priority']>('Medium');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
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
      setError('Failed to load jobs. Check that the backend server is running at ' + BACKEND_URL);
    } finally {
      setLoadingJobs(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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
    } catch {
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
      setSuccess(`Job ${id} triggered manually.`);
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

  // --- Theme Class Definitions (Conditional based on darkMode) ---
  
  // Main background (TRUE BLACK for dark mode)
  const mainBg = darkMode ? 'bg-black text-slate-100' : 'bg-gray-100 text-gray-800'; 
  
  // Primary Accent is now WHITE for dark mode (replaces purple)
  const accentColor = darkMode ? 'text-white' : 'text-blue-600'; 
  
  // BUTTONS: Primary Action Button uses the accent color for glow and background
  // Dark mode: Bright White background, Black text, White shadow glow
  const accentButtonBg = darkMode 
    ? 'bg-white text-black shadow-lg shadow-white/30 hover:bg-gray-200 active:shadow-white/10 hover:scale-[1.01] transition-all duration-200 ease-in-out' 
    : 'bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 active:shadow-blue-700/20 hover:scale-[1.01] transition-all duration-200 ease-in-out'; 
  
  const runButtonBg = darkMode 
    ? 'bg-white text-black shadow-md shadow-white/20 hover:bg-gray-200 active:shadow-white/5 hover:scale-[1.01] transition-all duration-200 ease-in-out' 
    : 'bg-blue-500 text-white shadow-sm shadow-blue-500/20 hover:bg-blue-600 active:shadow-blue-600/10 hover:scale-[1.01] transition-all duration-200 ease-in-out';
  
  // Card and Input Styling
  const cardBg = darkMode ? 'bg-slate-900/70 border-slate-800/70 shadow-xl shadow-black/60' : 'bg-white border-gray-200 shadow-md shadow-gray-200/40';
  const inputStyle = darkMode 
    ? 'border-slate-700 bg-slate-950/80 focus:border-white focus:ring-4 focus:ring-white/30 text-slate-200 text-base transition-shadow duration-300' 
    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 text-gray-800 text-base transition-shadow duration-300'; 
  
  // Typography & Table
  const headerText = darkMode ? 'text-slate-100' : 'text-gray-900';
  const subHeaderText = darkMode ? 'text-slate-400' : 'text-gray-600';
  const jsonText = darkMode ? 'text-emerald-400' : 'text-green-700';
  const tableBorder = darkMode ? 'border-slate-800/70' : 'border-gray-300';
  const tableHeadBg = darkMode ? 'bg-slate-900/90' : 'bg-gray-50';
  const tableHeaderText = darkMode ? 'text-slate-300' : 'text-gray-700';
  const tableRowText = darkMode ? 'text-slate-200' : 'text-gray-800'; 
  const tableHoverBg = darkMode ? 'hover:bg-slate-800/70' : 'hover:bg-gray-50';

  // Refresh Button uses White accent for dark mode
  const refreshButtonClasses = darkMode 
    ? `flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 border-white/50 text-white hover:bg-slate-800/50 active:bg-slate-700/50 hover:scale-[1.01]`
    : `flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 border-blue-500/50 text-blue-600 hover:bg-blue-50/50 active:bg-blue-100/50 hover:scale-[1.01]`;


  return (
    <main className={`min-h-screen ${mainBg}`}>
      <div className="max-w-7xl mx-auto py-8 px-5"> 
        
        {/* Header Section */}
        <header className="flex justify-between items-end mb-8 border-b pb-5 border-slate-800">
          <div className="flex items-center">
            <Cpu className={`w-10 h-10 ${accentColor} mr-4 animate-pulse-slow`} /> 
            <h1 className={`text-5xl font-extrabold tracking-tight ${headerText}`}> 
              Job Scheduler <span className={accentColor + (darkMode ? ' drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]' : ' drop-shadow-[0_0_8px_rgba(0,123,255,0.3)]')}>Core</span> {/* White glow for dark mode */}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className={`text-md ${subHeaderText} hidden sm:block`}> 
              Priority Queue Management System
            </p>
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full transition-all duration-300 ${
                darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
        </header>
        
        {/* Alerts Section */}
        {(error || success) && (
          <div className="mb-8">
            {error && (
              <div className={`p-4 rounded-xl text-base font-semibold flex items-center gap-3 shadow-lg mb-3 ${darkMode ? 'bg-red-900/10 border border-red-500/50 shadow-red-900/30 text-red-400' : 'bg-red-100 border border-red-400 shadow-red-200/50 text-red-700'}`}>
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className={`p-4 rounded-xl text-base font-semibold flex items-center gap-3 shadow-lg ${darkMode ? 'bg-emerald-900/10 border border-emerald-500/50 shadow-emerald-900/30 text-emerald-400' : 'bg-green-100 border border-green-400 shadow-green-200/50 text-green-700'}`}>
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            )}
          </div>
        )}

        {/* Job Stats Overview */}
        <JobStats jobs={jobs} darkMode={darkMode} />

        {/* Main Content Grid: Create Job and Job List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {/* LEFT: Job creation form */}
          <section className={`lg:col-span-1 border rounded-xl p-8 backdrop-blur-md h-fit transition-all duration-300 ${cardBg} hover:scale-[1.005] hover:shadow-2xl ${darkMode ? 'hover:shadow-white/10' : 'hover:shadow-blue-200/30'}`}> 
            <h2 className={`text-2xl font-bold mb-6 ${accentColor} flex items-center gap-3`}> 
              <Plus className="w-6 h-6" /> 
              Submit New Task
            </h2>
            <form className="space-y-5" onSubmit={handleCreateJob}> 
              {/* Task Name Input */}
              <div>
                <label className={`block text-sm font-semibold uppercase tracking-wider mb-2 ${subHeaderText}`}>Task Name</label> 
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className={`w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 transition-all ${inputStyle}`} 
                  placeholder="e.g. ProcessUserDataBatch"
                />
              </div>

              {/* Payload Textarea */}
              <div>
                <label className={`block text-sm font-semibold uppercase tracking-wider mb-2 ${subHeaderText}`}>Payload (JSON)</label>
                <textarea
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  rows={8}
                  className={`w-full rounded-lg border px-4 py-3 font-mono outline-none focus:ring-2 transition-all ${inputStyle} ${jsonText}`}
                />
                <p className={`mt-1 text-sm ${subHeaderText}`}> 
                  Data structure passed to the worker.
                </p>
              </div>

              {/* Priority Select */}
              <div>
                <label className={`block text-sm font-semibold uppercase tracking-wider mb-2 ${subHeaderText}`}>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Job['priority'])}
                  className={`w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 transition-all appearance-none ${inputStyle}`}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {/* Submit Button (Bright White, Glowing) */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full mt-6 rounded-lg px-5 py-3.5 text-lg font-bold flex items-center justify-center gap-3 ${accentButtonBg}`}
              > 
                {submitting ? (
                  <>
                    <RotateCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Queue Job
                  </>
                )}
              </button>
            </form>
          </section>

          {/* RIGHT: Jobs list */}
          <section className={`lg:col-span-2 xl:col-span-3 border rounded-xl p-8 backdrop-blur-md transition-all duration-300 ${cardBg} hover:scale-[1.005] hover:shadow-2xl ${darkMode ? 'hover:shadow-white/10' : 'hover:shadow-blue-200/30'}`}> 
            <div className="flex items-center justify-between mb-6"> 
              <h2 className={`text-2xl font-bold ${headerText}`}> 
                Job Queue and History
                <span className={`ml-3 text-base font-normal ${subHeaderText}`}>
                  ({jobs.length} total)
                </span>
              </h2>
              <button
                onClick={fetchJobs}
                disabled={loadingJobs}
                className={refreshButtonClasses} 
              >
                <RotateCw className={`w-4 h-4 ${loadingJobs ? 'animate-spin' : ''}`} />
                {loadingJobs ? 'Syncing...' : 'Refresh'}
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6"> 
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`flex-1 max-w-[220px] rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 transition ${inputStyle}`} 
              >
                <option value="all">Status: All</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={`flex-1 max-w-[220px] rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-2 transition ${inputStyle}`}
              >
                <option value="all">Priority: All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Job Table */}
            <div className={`rounded-lg overflow-hidden shadow-2xl ${darkMode ? 'shadow-black/70' : 'shadow-gray-300/50'} border ${tableBorder}`}>
              <table className="w-full text-base"> 
                <thead className={`${tableHeadBg} sticky top-0`}>
                  <tr>
                    {['ID', 'Task', 'Priority', 'Status', 'Created At', 'Action'].map(header => (
                      <th key={header} className={`px-4 py-4 text-left text-sm font-bold uppercase tracking-wider border-b ${tableBorder} ${tableHeaderText}`}> 
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingJobs ? (
                    <tr>
                      <td colSpan={6} className={`px-4 py-8 text-center ${subHeaderText}`}> 
                        <RotateCw className={`w-6 h-6 mx-auto animate-spin mb-3 ${accentColor}`} />
                        Loading job data from the core system...
                      </td>
                    </tr>
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={`px-4 py-8 text-center italic ${subHeaderText}`}>
                        No jobs match the current filter.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className={`border-t ${tableBorder} ${tableHoverBg} transition duration-150`}>
                        <td className={`px-4 py-4 font-mono ${subHeaderText}`}>{job.id}</td> 
                        <td className={`px-4 py-4 font-medium ${tableRowText}`}>{job.taskName}</td>
                        <td className="px-4 py-4">
                            <PriorityChip priority={job.priority} darkMode={darkMode} />
                        </td>
                        <td className="px-4 py-4">
                            <StatusChip status={job.status} darkMode={darkMode} />
                        </td>
                        <td className={`px-4 py-4 text-sm ${subHeaderText}`}>
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleRunJob(job.id)}
                            disabled={job.status === 'running'}
                            className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-bold flex items-center justify-center ${runButtonBg}`}
                          > 
                            <Play className="w-3 h-3" />
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