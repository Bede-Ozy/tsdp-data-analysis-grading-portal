import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllStudents, getAllCoaches, getAllStudentsPerformance } from '../../services/api';
import { PROGRAM_INFO, getGradeLetter } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Users,
  Award,
  Clock,
  TrendingUp,
  FileBarChart,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  UserX,
  ExternalLink,
  Search
} from 'lucide-react';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [studentsPerformance, setStudentsPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [stdsRes, coaRes, perfRes] = await Promise.all([
          getAllStudents().catch(() => ({ success: false, data: [] })),
          getAllCoaches().catch(() => ({ success: false, data: [] })),
          getAllStudentsPerformance().catch(() => ({ success: false, data: [] }))
        ]);

        const stdsList = Array.isArray(stdsRes) ? stdsRes : (stdsRes?.data || stdsRes?.students || []);
        const coaList = Array.isArray(coaRes) ? coaRes : (coaRes?.data || coaRes?.coaches || coaRes?.result || []);
        const perfList = Array.isArray(perfRes) ? perfRes : (perfRes?.data || perfRes?.result || []);

        setStudents(stdsList);
        setCoaches(coaList);
        setStudentsPerformance(perfList);
      } catch (err) {
        console.error('Failed to load data for admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading administrative overview from live database..." />;
  }

  // 1. Total Students
  const totalStudents = students.length;

  // 2. Total Coaches
  const totalCoaches = coaches.length;

  // 3. Active Students
  const activeStudents = students.filter(s => {
    const st = String(s.status || '').trim().toLowerCase();
    return st === 'active' || (st !== 'inactive' && st !== 'disabled');
  }).length;

  // 4. Active Coaches
  const activeCoaches = coaches.filter(c => {
    const st = String(c.status || '').trim().toLowerCase();
    return st === 'active' || (st !== 'inactive' && st !== 'disabled');
  }).length;

  // 5. Class Average Score (Average of finalScore from getAllStudentsPerformance)
  const validScores = studentsPerformance
    .map(p => p.finalScore !== undefined && p.finalScore !== null ? Number(p.finalScore) : (p.overallScore !== undefined && p.overallScore !== null ? Number(p.overallScore) : null))
    .filter(s => s !== null && !isNaN(s));

  const classAvgScore = validScores.length > 0
    ? Math.round(validScores.reduce((sum, s) => sum + s, 0) / validScores.length)
    : (students.some(s => s.overallScore !== undefined && s.overallScore !== null)
      ? Math.round(students.reduce((sum, s) => sum + (Number(s.overallScore) || 0), 0) / students.length)
      : null);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-primary via-[#003E7E] to-brand-success rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-xs border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Program Governance Console · ITF-NECA-TSDP 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">
              Cohort Executive Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              Live program metrics, staff rosters, and resident performance aggregated from Google Sheets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/reports"
              className="bg-white hover:bg-gray-100 text-brand-primary font-medium px-5 py-2.5 rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center gap-2 text-sm"
            >
              <FileBarChart className="w-4 h-4" />
              <span>Performance Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards — 5 Metrics requested */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Students */}
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Total Students</span>
            <Users className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">{totalStudents}</span>
            <span className="badge-primary text-[10px]">Roster</span>
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">Enrolled residents</p>
        </div>

        {/* Total Coaches */}
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Total Coaches</span>
            <UserCheck className="w-4 h-4 text-brand-secondary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-secondary">{totalCoaches}</span>
            <span className="badge-secondary text-[10px]">Faculty</span>
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">From COACHES_MASTER</p>
        </div>

        {/* Active Students */}
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Active Students</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-emerald-600">{activeStudents}</span>
            <span className="badge-success text-[10px]">Active</span>
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">Status compliance</p>
        </div>

        {/* Active Coaches */}
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Active Coaches</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-emerald-600">{activeCoaches}</span>
            <span className="badge-success text-[10px]">Active</span>
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">Operational staff</p>
        </div>

        {/* Class Average Score */}
        <div className="portal-card col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Class Avg Score</span>
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-primary">
              {classAvgScore !== null ? `${classAvgScore}%` : '0%'}
            </span>
            {classAvgScore !== null && <span className="badge-primary text-[10px]">Cohort Mean</span>}
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">Across final scores</p>
        </div>
      </div>

      {/* Management Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/students"
          className="portal-card p-5 hover:border-brand-primary transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 group-hover:text-brand-primary text-base">
                Manage Residents ({students.length})
              </h3>
              <p className="text-xs text-brand-neutral-muted mt-0.5">
                Toggle Active/Inactive status, view groups, and inspect student records.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-primary" />
        </Link>

        <Link
          to="/admin/coaches"
          className="portal-card p-5 hover:border-brand-secondary transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-brand-secondary flex items-center justify-center group-hover:bg-brand-secondary group-hover:text-white transition-colors">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 group-hover:text-brand-secondary text-base">
                Manage Coaches ({coaches.length})
              </h3>
              <p className="text-xs text-brand-neutral-muted mt-0.5">
                Toggle Active/Inactive status, assign tracks, and view faculty from COACHES_MASTER.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-secondary" />
        </Link>
      </div>
    </div>
  );
}
