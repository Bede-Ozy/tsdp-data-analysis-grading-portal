import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPendingSubmissions, getPendingSocialPosts, getAllStudents } from '../../services/api';
import { PROGRAM_INFO } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  QrCode,
  CheckSquare,
  MessageSquare,
  Database,
  Flag,
  Users,
  Smile,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Award,
  AlertTriangle,
  Pencil,
  Check
} from 'lucide-react';

export default function CoachDashboard() {
  const { user, updateUserProfile } = useAuth();
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');

  const handleSaveName = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateUserProfile({ name: nameInput.trim() });
    }
    setIsEditingName(false);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [subsRes, postsRes, stdsRes] = await Promise.all([
          getPendingSubmissions().catch(() => ({ success: false, data: [] })),
          getPendingSocialPosts().catch(() => ({ success: false, data: [] })),
          getAllStudents().catch(() => ({ success: false, data: [] }))
        ]);
        const subsList = Array.isArray(subsRes) ? subsRes : (subsRes?.data || []);
        const postsList = Array.isArray(postsRes) ? postsRes : (postsRes?.data || []);
        const stdsList = Array.isArray(stdsRes) ? stdsRes : (stdsRes?.data || []);

        setPendingSubmissions(subsList.filter(s => s.status === 'Ungraded'));
        setPendingPosts(postsList.filter(p => p.status === 'Pending'));
        setStudents(stdsList);
      } catch (err) {
        console.error('Error loading coach dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading coach dashboard..." />;
  }

  const avgScore = students.length > 0 && students.some(s => s.overallScore !== undefined && s.overallScore !== null)
    ? Math.round(students.reduce((sum, s) => sum + (s.overallScore || 0), 0) / students.length)
    : null;

  const avgAttendance = students.length > 0 && students.some(s => s.attendanceRate !== undefined && s.attendanceRate !== null)
    ? Math.round(students.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / students.length)
    : null;

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Coach';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-secondary via-brand-secondary-dark to-[#B45309] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20">
              <Award className="w-3.5 h-3.5" />
              <span>Instructor Console · {user?.track || 'TSDP Instructor'}</span>
            </div>

            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name"
                  className="px-3 py-1.5 rounded-lg text-sm font-bold text-brand-neutral bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-white"
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-1.5 bg-white text-brand-secondary-dark rounded-lg hover:bg-orange-50 font-bold"
                  title="Save Name"
                >
                  <Check className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                  Welcome, {displayName}!
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(displayName);
                    setIsEditingName(true);
                  }}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  title="Edit your display name"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs sm:text-sm text-orange-100 max-w-xl">
              TSDP 2026 Data Analytics Cohort · Week {PROGRAM_INFO.currentWeek} Active · {students.length > 0 ? `${students.length} Residents Enrolled` : 'Connecting to live database...'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/coach/attendance-code"
              className="bg-white hover:bg-orange-50 text-brand-secondary-dark font-medium px-5 py-2.5 rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center gap-2 text-sm"
            >
              <QrCode className="w-4 h-4" />
              <span>Generate Attendance Code</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Pending Submissions</span>
            <CheckSquare className="w-4 h-4 text-brand-secondary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
              {pendingSubmissions.length}
            </span>
            {pendingSubmissions.length > 0 ? (
              <span className="badge-secondary text-[10px]">Needs Review</span>
            ) : (
              <span className="text-xs text-brand-neutral-muted">All Graded</span>
            )}
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">Technical & Professional files</p>
        </div>

        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Pending Social Posts</span>
            <CheckCircle className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
              {pendingPosts.length}
            </span>
            {pendingPosts.length > 0 ? (
              <span className="badge-primary text-[10px]">Awaiting Score</span>
            ) : (
              <span className="text-xs text-brand-neutral-muted">None Pending</span>
            )}
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">LinkedIn & Twitter links</p>
        </div>

        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Class Average Score</span>
            <Award className="w-4 h-4 text-brand-success" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-success">
              {avgScore !== null ? `${avgScore}%` : '—'}
            </span>
            {avgScore !== null && <span className="badge-success text-[10px]">Cohort Mean</span>}
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">
            {students.length > 0 ? `Across ${students.length} enrolled residents` : 'No score data available'}
          </p>
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
            {avgAttendance !== null && <span className="badge-success text-[10px]">Active</span>}
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">
            {students.length > 0 ? 'Punctuality compliance' : 'No attendance data available'}
          </p>
        </div>
      </div>


      {/* Quick Action Matrix for Coach */}
      <div className="portal-card">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Instructor Grading & Evaluation Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/coach/attendance-code"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-brand-secondary hover:bg-orange-50/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-orange-100 text-brand-secondary group-hover:bg-brand-secondary group-hover:text-white flex items-center justify-center transition-colors">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-brand-secondary">
                Attendance Code
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">Broadcast 6-char passcode with 10-min countdown</p>
          </Link>

          <Link
            to="/coach/grade-submissions"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-brand-primary hover:bg-blue-50/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-brand-primary group-hover:bg-brand-primary group-hover:text-white flex items-center justify-center transition-colors">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-brand-primary">
                Grade Submissions
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">Review Drive solution files and score 0-10</p>
          </Link>

          <Link
            to="/coach/class-activity"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-brand-primary hover:bg-blue-50/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-brand-primary">
                Record Class Activity
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">Live question answers, forms, & hands-on exercises</p>
          </Link>

          <Link
            to="/coach/grade-module-projects"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-emerald-600 hover:bg-emerald-50/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Database className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-emerald-600">
                Bulk Grade Projects
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">Enter monthly module scores (0-100) for enrolled residents</p>
          </Link>

          <Link
            to="/coach/grade-capstone"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-amber-600 hover:bg-amber-50/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Flag className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-amber-600">
                Capstone Sprints
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">Presentation, Technical & Progress scores (0-50)</p>
          </Link>

          <Link
            to="/coach/grade-presentations"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-cyan-600 hover:bg-cyan-50/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-cyan-600">
                Group Presentations
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">4 rubric criteria (1-5) plus individual Q&A scores</p>
          </Link>

          <Link
            to="/coach/soft-skills"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-pink-600 hover:bg-pink-50/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-pink-100 text-pink-600 group-hover:bg-pink-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Smile className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-pink-600">
                Soft Skills Evaluation
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">6 behavioral criteria (Communication, Teamwork, Leadership...)</p>
          </Link>

          <Link
            to="/coach/approve-social-media"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-purple-600 hover:bg-purple-50/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-purple-600">
                Approve Social Posts
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">Verify LinkedIn/Twitter URLs and award up to 5 points</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
