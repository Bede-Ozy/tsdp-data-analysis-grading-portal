import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getExamConfig,
  getAllExamResults,
  activateExam,
  deactivateExam,
  getAllStudents,
} from '../../services/api';
import {
  FileQuestion,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Download,
  RefreshCw,
  Filter,
} from 'lucide-react';

const STATUS_COLORS = {
  'Submitted': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'AutoSubmitted': 'bg-blue-100 text-blue-800 border-blue-200',
  'In Progress': 'bg-amber-100 text-amber-800 border-amber-200',
  'Not Started': 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function ManageExam() {
  const { role } = useAuth();
  const [config, setConfig] = useState(null);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [filter, setFilter] = useState('All');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, res, stu] = await Promise.all([
        getExamConfig().catch(() => null),
        getAllExamResults().catch(() => []),
        getAllStudents().catch(() => ({ data: [] })),
      ]);
      setConfig(cfg);
      setResults(Array.isArray(res) ? res : []);
      const stuList = Array.isArray(stu) ? stu : (stu?.data || []);
      setStudents(stuList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleToggle = async () => {
    setConfirmToggle(false);
    setToggling(true);
    try {
      const fn = config?.isActive ? deactivateExam : activateExam;
      const res = await fn();
      if (res?.success) {
        showToast(res.message || `Exam ${config?.isActive ? 'deactivated' : 'activated'} successfully.`);
        await loadAll();
      } else {
        showToast(res?.message || 'Toggle failed. Please retry.');
      }
    } catch {
      showToast('Network error during toggle.');
    } finally {
      setToggling(false);
    }
  };

  // Merge students with results
  const tableRows = students.map(stu => {
    const stuID = stu.studentID || stu.id || '';
    const stuNum = stu.studentNumber || '';
    const result = results.find(r =>
      r.studentID === stuID ||
      r.studentNumber == stuNum ||
      r.studentID === stuNum
    );
    const status = result
      ? (result.autoSubmitted ? 'AutoSubmitted' : 'Submitted')
      : 'Not Started';
    return {
      studentID: stuID,
      studentNumber: stuNum,
      name: stu.name || stu.studentName || `${stu.firstName || ''} ${stu.lastName || ''}`.trim() || stuID,
      status,
      score: result ? (result.scorePercent ?? result.scoreRaw ?? null) : null,
      passed: result ? (result.passed ?? (result.scorePercent >= 70)) : null,
    };
  });

  // Filter
  const filtered = tableRows.filter(r => {
    if (filter === 'All') return true;
    if (filter === 'Submitted') return r.status === 'Submitted' || r.status === 'AutoSubmitted';
    if (filter === 'Passed') return r.passed === true;
    if (filter === 'Failed') return r.passed === false;
    return true;
  });

  // Metrics
  const totalStudents = students.length;
  const submittedCount = results.length;
  const avgScore = submittedCount > 0
    ? Math.round(results.reduce((s, r) => s + (r.scorePercent ?? r.scoreRaw ?? 0), 0) / submittedCount)
    : 0;
  const passCount = results.filter(r => r.passed ?? (r.scorePercent >= 70)).length;
  const passRate = submittedCount > 0 ? Math.round((passCount / submittedCount) * 100) : 0;

  const exportCSV = () => {
    const headers = ['Student ID', 'Name', 'Status', 'Score (%)', 'Passed'];
    const rows = filtered.map(r => [
      r.studentID,
      r.name,
      r.status,
      r.score !== null ? r.score : '',
      r.passed !== null ? (r.passed ? 'Yes' : 'No') : '',
    ]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const isActive = config?.isActive === true;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-white border border-slate-200 shadow-lg rounded-xl px-4 py-3 text-sm font-medium text-slate-800 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileQuestion className="w-6 h-6 text-brand-primary" />
          Manage Final Exam
        </h1>
        <p className="text-sm text-slate-500 mt-1">Control exam activation and monitor student results</p>
      </div>

      {/* Status banner */}
      <div className={`rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isActive
          ? 'bg-emerald-600 text-white'
          : 'bg-slate-200 text-slate-700'
      }`}>
        <div className="flex items-center gap-3">
          {isActive
            ? <CheckCircle2 className="w-6 h-6 text-white" />
            : <XCircle className="w-6 h-6 text-slate-500" />
          }
          <div>
            <p className="font-bold text-lg">{isActive ? 'EXAM IS ACTIVE' : 'EXAM IS INACTIVE'}</p>
            <p className={`text-sm ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
              {isActive
                ? 'Students can currently access and take the exam.'
                : 'Students see a locked teaser card. Exam is not accessible.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setConfirmToggle(true)}
          disabled={toggling || loading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${
            isActive
              ? 'bg-white text-emerald-700 hover:bg-emerald-50'
              : 'bg-brand-primary text-white hover:bg-brand-primary-dark'
          }`}
        >
          {isActive
            ? <><ToggleRight className="w-5 h-5" /> Deactivate Exam</>
            : <><ToggleLeft className="w-5 h-5" /> Activate Exam</>
          }
        </button>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Questions', value: config?.totalQuestions ?? '—', icon: FileQuestion, color: 'text-brand-primary bg-blue-50' },
          { label: 'Submitted', value: `${submittedCount}/${totalStudents}`, icon: Users, color: 'text-emerald-700 bg-emerald-50' },
          { label: 'Average Score', value: submittedCount > 0 ? `${avgScore}%` : '—', icon: CheckCircle2, color: 'text-amber-700 bg-amber-50' },
          { label: 'Pass Rate', value: submittedCount > 0 ? `${passRate}%` : '—', icon: CheckCircle2, color: 'text-purple-700 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="portal-card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-slate-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Results table */}
      <div className="portal-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-bold text-slate-800">Student Results</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter */}
            <div className="flex items-center gap-1.5 text-sm">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                {['All', 'Submitted', 'Passed', 'Failed'].map(f => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <button
              onClick={loadAll}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-semibold">
                <th className="py-2 px-3 text-left">Student</th>
                <th className="py-2 px-3 text-center">Status</th>
                <th className="py-2 px-3 text-center">Score</th>
                <th className="py-2 px-3 text-center">Passed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">No students found for this filter.</td></tr>
              ) : filtered.map((row, idx) => (
                <tr key={row.studentID || idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-slate-800">{row.name}</p>
                    <p className="text-xs text-slate-400">{row.studentID}</p>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_COLORS[row.status] || STATUS_COLORS['Not Started']}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-bold text-sm ${row.score !== null ? 'text-slate-800' : 'text-slate-400'}`}>
                      {row.score !== null ? `${row.score}%` : '—'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.passed === true && <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />}
                    {row.passed === false && <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                    {row.passed === null && <span className="text-slate-300 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-xs text-slate-400 mt-3">
            Showing {filtered.length} of {tableRows.length} students
          </p>
        )}
      </div>

      {/* Confirm toggle modal */}
      {confirmToggle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {isActive ? 'Deactivate' : 'Activate'} Exam?
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              {isActive
                ? 'This will immediately lock the exam. Students currently in progress will still be able to complete it (their timer continues), but new attempts will be blocked.'
                : 'This will open the exam to all eligible students. Make sure all questions are loaded before activating.'}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmToggle(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleToggle}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white text-sm font-bold transition-colors ${
                  isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

