import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentPerformance } from '../../services/api';
import { PROGRAM_INFO, getGradeLetter } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Calendar,
  Clock,
  Upload,
  FolderArchive,
  Share2,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  BookOpen,
  Pencil,
  Check
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, updateUserProfile } = useAuth();
  const [performance, setPerformance] = useState(null);
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
        const studentID = user?.studentID || (user?.studentNumber ? `TSDP2026-RES-${String(user.studentNumber).padStart(3, '0')}` : '');
        if (!studentID) {
          setLoading(false);
          return;
        }
        const res = await getStudentPerformance(studentID);
        if (res && res.success) {
          setPerformance(res.data);
        }
      } catch (err) {
        console.error('Error loading performance:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading resident dashboard..." />;
  }

  const overallScore = performance?.overallScore !== undefined && performance?.overallScore !== null
    ? performance.overallScore
    : (user?.overallScore !== undefined && user?.overallScore !== null ? user.overallScore : null);
  const gradeInfo = overallScore !== null ? getGradeLetter(overallScore) : { letter: "-", label: "Pending", color: "text-gray-500 bg-gray-50 border-gray-200" };
  const attendanceRate = performance?.attendanceRate !== undefined && performance?.attendanceRate !== null
    ? performance.attendanceRate
    : (user?.attendanceRate !== undefined && user?.attendanceRate !== null ? user.attendanceRate : null);
  const rank = performance?.rank || user?.rank || null;

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Resident Student';

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-brand-primary via-brand-primary-dark to-[#002B54] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-32 h-32 bg-brand-secondary/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-100 text-xs font-semibold backdrop-blur-xs border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-brand-secondary" />
              <span>Week {PROGRAM_INFO.currentWeek} of {PROGRAM_INFO.totalWeeks} · 4-Month Data Analytics</span>
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
                  className="p-1.5 bg-white text-brand-primary rounded-lg hover:bg-blue-50 font-bold"
                  title="Save Name"
                >
                  <Check className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                  Welcome back, {displayName}!
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
            <p className="text-sm text-blue-100 max-w-xl">
              Resident ID: <span className="font-mono font-medium text-white">{user?.studentID || (user?.studentNumber ? `TSDP2026-RES-${user.studentNumber}` : '')}</span>
              {user?.classGroup && <span> · {user.classGroup}</span>}
              {user?.capstoneGroup && <span> · {user.capstoneGroup}</span>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student/attendance"
              className="btn-secondary py-2.5 px-5 font-medium shadow-xs hover:shadow-sm transition-all"
            >
              <Clock className="w-4 h-4" />
              <span>Mark Today's Attendance</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Cumulative Score */}
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Overall Score</span>
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
              {overallScore !== null ? `${overallScore}%` : '—'}
            </span>
            {overallScore !== null ? (
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${gradeInfo.color}`}>
                {gradeInfo.letter} ({gradeInfo.label})
              </span>
            ) : (
              <span className="text-xs text-brand-neutral-muted">Pending</span>
            )}
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">Weighted across all 9 metrics</p>
        </div>

        {/* Cohort Rank */}
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Cohort Rank</span>
            <Award className="w-4 h-4 text-brand-secondary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-secondary">
              {rank ? `#${rank}` : '—'}
            </span>
            {rank && <span className="text-xs font-medium text-brand-neutral-muted">Cohort Standing</span>}
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">
            {rank ? 'Active cohort performance ranking' : 'Rank calculated after grading'}
          </p>
        </div>

        {/* Attendance Rate */}
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Attendance</span>
            <Clock className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
              {attendanceRate !== null ? `${attendanceRate}%` : '—'}
            </span>
            {attendanceRate !== null && <span className="badge-success text-[10px]">Tracked</span>}
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">
            {attendanceRate !== null ? 'Punctuality threshold: 9:30 AM' : 'No attendance recorded yet'}
          </p>
        </div>

        {/* Module Progress */}
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Curriculum</span>
            <BookOpen className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-semibold text-brand-neutral">Data Analytics</span>
            <span className="badge-primary text-[10px]">Week {PROGRAM_INFO.currentWeek}</span>
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">Technical & Professional modules</p>
        </div>
      </div>


      {/* Quick Action Tasks Grid */}
      <div className="portal-card">
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span>Resident Actions & Submissions</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/student/attendance"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-brand-primary hover:bg-brand-primary-light/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 group-hover:bg-brand-primary text-brand-primary group-hover:text-white flex items-center justify-center transition-colors">
                <Clock className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-brand-primary">
                Mark Attendance
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">Enter today's 6-character session passcode</p>
          </Link>

          <Link
            to="/student/submit-assignment"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-brand-primary hover:bg-brand-primary-light/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-orange-50 group-hover:bg-brand-secondary text-brand-secondary group-hover:text-white flex items-center justify-center transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-brand-primary">
                Submit Assignment
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">Technical or Professional class homework</p>
          </Link>

          <Link
            to="/student/submit-module-project"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-brand-primary hover:bg-brand-primary-light/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                <FolderArchive className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-brand-primary">
                Submit Project
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">Monthly milestone projects (Excel, SQL, PowerBI, Python)</p>
          </Link>

          <Link
            to="/student/submit-social-media"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-brand-primary hover:bg-brand-primary-light/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-brand-primary">
                Social Media Post
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">Submit LinkedIn or Twitter post URLs for 5% weight</p>
          </Link>
        </div>
      </div>

      {/* Recent Feedback & Attendance History Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Feedback */}
        <div className="portal-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">Recent Coach Feedback</h3>
            <Link to="/student/performance" className="text-xs font-medium text-brand-primary hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {performance?.recentFeedback && performance.recentFeedback.length > 0 ? (
              performance.recentFeedback.map((fb, idx) => (
                <div key={idx} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-brand-neutral">{fb.item}</span>
                    <span className="badge-primary font-mono">{fb.score}</span>
                  </div>
                  <p className="text-xs text-brand-neutral-muted italic">"{fb.note}"</p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                    <span>{fb.from}</span>
                    <span>{fb.date}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-brand-neutral-muted">No recent feedback recorded.</p>
            )}
          </div>
        </div>

        {/* Recent Attendance Log */}
        <div className="portal-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-brand-neutral">Attendance Log</h3>
            <Link to="/student/attendance" className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1">
              <span>Mark Today</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {performance?.attendanceHistory && performance.attendanceHistory.length > 0 ? (
              performance.attendanceHistory.slice(0, 4).map((att, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/60 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${att.status === 'Present' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div>
                      <span className="font-bold text-brand-neutral">Week {att.week} · Day {att.day}</span>
                      <span className="text-gray-400 ml-2">({att.sessionType})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-[11px]">{att.arrivalTime}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      att.status === 'Present'
                        ? 'bg-blue-50 text-brand-success border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {att.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-brand-neutral-muted py-3 text-center">No attendance logs recorded yet.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
