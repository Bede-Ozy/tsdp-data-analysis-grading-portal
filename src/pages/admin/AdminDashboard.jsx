import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllStudents, getAllStudentsPerformance } from '../../services/api';
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
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAllStudents();
        const list = Array.isArray(res) ? res : (res?.data || res?.students || []);
        if (list.length > 0) {
          setStudents(list);
        }
      } catch (err) {
        console.error('Failed to load students for admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading comprehensive administrative overview..." />;
  }

  const total = students.length;
  const avgScore = total > 0 && students.some(s => s.overallScore !== undefined && s.overallScore !== null)
    ? Math.round(students.reduce((sum, s) => sum + (s.overallScore || 0), 0) / total)
    : null;
  const avgAttendance = total > 0 && students.some(s => s.attendanceRate !== undefined && s.attendanceRate !== null)
    ? Math.round(students.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / total)
    : null;
  const capstoneGroupCount = new Set(students.map(s => s.capstoneGroup).filter(Boolean)).size;

  // Sort top 5 performers
  const topStudents = [...students]
    .filter(s => s.overallScore !== undefined && s.overallScore !== null)
    .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
    .slice(0, 5);

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
              Automated Analytics Grading & Performance Tracking System managed by ShamzBridge Consult.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/reports"
              className="bg-white hover:bg-gray-100 text-brand-primary font-medium px-5 py-2.5 rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center gap-2 text-sm"
            >
              <FileBarChart className="w-4 h-4" />
              <span>Full Performance Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Total Residents</span>
            <Users className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">{total}</span>
            <span className="badge-primary text-[10px]">{total > 0 ? 'Enrolled' : 'No Records'}</span>
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">Active database roster</p>
        </div>

        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Cohort Mean Score</span>
            <TrendingUp className="w-4 h-4 text-brand-secondary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
              {avgScore !== null ? `${avgScore}%` : '—'}
            </span>
            {avgScore !== null && <span className="badge-secondary text-[10px]">Average</span>}
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">Weighted across all 9 components</p>
        </div>

        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Average Attendance</span>
            <Clock className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
              {avgAttendance !== null ? `${avgAttendance}%` : '—'}
            </span>
            {avgAttendance !== null && <span className="badge-success text-[10px]">Tracked</span>}
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">Punctuality compliance rate</p>
        </div>

        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Capstone Groups</span>
            <Award className="w-4 h-4 text-brand-success" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-success">
              {capstoneGroupCount > 0 ? capstoneGroupCount : '—'}
            </span>
            <span className="badge-success text-[10px]">Active Groups</span>
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">Resident project syndicates</p>
        </div>
      </div>

      {/* Two Column Section: Top Performers & Quick Admin Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers Leaderboard */}
        <div className="lg:col-span-2 portal-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-secondary" />
                <span>Cohort Top Performers Leaderboard</span>
              </h3>
              <p className="text-xs text-brand-neutral-muted">Leading residents based on overall weighted evaluation</p>
            </div>
            <Link to="/admin/students" className="text-xs font-medium text-brand-primary hover:underline flex items-center gap-1">
              <span>View All Residents</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {topStudents.length === 0 ? (
              <p className="text-xs text-brand-neutral-muted py-8 text-center">
                No resident performance data available from backend.
              </p>
            ) : (
              topStudents.map((s, idx) => {
                const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentID;
                const grade = getGradeLetter(s.overallScore);
                return (
                  <div key={s.studentID} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' :
                        idx === 1 ? 'bg-slate-200 text-slate-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-medium text-sm text-slate-800">{sName}</span>
                        <span className="text-xs text-gray-400 block font-mono">
                          {s.studentID}{s.classGroup ? ` · ${s.classGroup}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-semibold text-sm text-brand-primary">{s.overallScore}%</span>
                        {s.attendanceRate !== undefined && s.attendanceRate !== null && (
                          <span className="text-[10px] text-gray-400 block">Attendance: {s.attendanceRate}%</span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${grade.color}`}>
                        {grade.letter}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>


        {/* Quick Management Links */}
        <div className="portal-card space-y-4">
          <h3 className="text-base font-semibold text-slate-800">Administrative Shortcuts</h3>

          <div className="space-y-3">
            <Link
              to="/admin/students"
              className="p-3.5 rounded-xl border border-slate-200/80 hover:border-brand-primary hover:bg-brand-primary-light/30 transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-brand-primary flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-medium text-sm text-slate-800 group-hover:text-brand-primary block">
                    Manage Residents
                  </span>
                  <span className="text-xs text-brand-neutral-muted">
                    {students.length > 0 ? `${students.length} enrolled residents` : 'View enrolled residents'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary" />
            </Link>

            <Link
              to="/admin/coaches"
              className="p-3.5 rounded-xl border border-slate-200/80 hover:border-brand-secondary hover:bg-orange-50/30 transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-100 text-brand-secondary flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-medium text-sm text-slate-800 group-hover:text-brand-secondary block">
                    Manage Coaches
                  </span>
                  <span className="text-xs text-brand-neutral-muted">Technical & Professional Tutors</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-secondary" />
            </Link>

            <Link
              to="/admin/reports"
              className="p-3.5 rounded-xl border border-slate-200/80 hover:border-brand-success hover:bg-emerald-50/30 transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-brand-success flex items-center justify-center">
                  <FileBarChart className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-medium text-sm text-slate-800 group-hover:text-brand-success block">
                    Generate Reports
                  </span>
                  <span className="text-xs text-brand-neutral-muted">Export cohort CSV & summaries</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-success" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
