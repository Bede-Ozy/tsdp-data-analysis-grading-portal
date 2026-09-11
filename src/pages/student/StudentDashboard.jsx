import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentDashboard } from '../../services/api';
import { PROGRAM_INFO, getGradeLetter } from '../../utils/constants';
import ScoreTable from '../../components/ScoreTable';
import { CardSkeleton, KPIGridSkeleton, TableSkeleton } from '../../components/SkeletonLoader';
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
  Check,
  Activity,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, updateUserProfile } = useAuth();
  const [performance, setPerformance] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [classActivities, setClassActivities] = useState([]);
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
      const studentID = user?.studentID || (user?.studentNumber ? `TSDP2026-RES-${String(user.studentNumber).padStart(3, '0')}` : '');
      if (!studentID) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await getStudentDashboard(studentID);
        if (res && res.success !== false) {
          const payload = res.data || res;
          
          // 1. Performance Data
          const pData = payload.performance || (payload.finalScore !== undefined || payload.overallScore !== undefined ? payload : null);
          setPerformance(pData);

          // 2. Attendance Data
          const aData = payload.attendance || (payload.records || payload.attendanceRate !== undefined ? payload : null);
          setAttendanceData(aData);

          // 3. Class Activities
          const act = payload.activities || payload.classActivities || [];
          const list = Array.isArray(act) ? act : (act.records || act.data || []);
          setClassActivities(list);
        }
      } catch (err) {
        console.error('Error loading student dashboard records:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Hero Card Metrics
  const overallScore = performance?.finalScore !== undefined && performance?.finalScore !== null
    ? performance.finalScore
    : (performance?.overallScore !== undefined && performance?.overallScore !== null ? performance.overallScore : null);

  const gradeLetter = performance?.grade || (overallScore !== null ? getGradeLetter(overallScore).letter : '—');
  const gradeInfo = overallScore !== null
    ? getGradeLetter(overallScore)
    : { letter: gradeLetter, label: gradeLetter !== '—' ? 'Recorded' : 'Pending', color: 'text-gray-500 bg-gray-50 border-gray-200' };

  const rank = performance?.rank ? `#${performance.rank}` : (user?.rank ? `#${user.rank}` : null);

  const attendanceRate = attendanceData?.attendanceRate !== undefined && attendanceData?.attendanceRate !== null
    ? attendanceData.attendanceRate
    : (performance?.attendanceRate !== undefined && performance?.attendanceRate !== null ? performance.attendanceRate : null);

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || performance?.studentName || 'Resident Student';
  const studentIDDisplay = user?.studentID || (user?.studentNumber ? `TSDP2026-RES-${user.studentNumber}` : 'Student');

  // Attendance Records
  const attendanceRecords = Array.isArray(attendanceData?.records)
    ? attendanceData.records
    : (Array.isArray(attendanceData)
      ? attendanceData
      : (Array.isArray(performance?.attendanceHistory) ? performance.attendanceHistory : []));

  const TOTAL_PROGRAM_DAYS = 80;

  const presentCount = attendanceData?.presentCount !== undefined && attendanceData?.presentCount !== null
    ? Number(attendanceData.presentCount)
    : attendanceRecords.filter(r => String(r.status || '').toLowerCase() === 'present').length;

  const lateCount = attendanceData?.lateCount !== undefined && attendanceData?.lateCount !== null
    ? Number(attendanceData.lateCount)
    : attendanceRecords.filter(r => String(r.status || '').toLowerCase() === 'late').length;

  // Present Rate = (Present ÷ 80) × 100 (Only Present Rate counts toward grade)
  const presentRate = Number(((presentCount / TOTAL_PROGRAM_DAYS) * 100).toFixed(1));

  // Late Rate = (Late ÷ 80) × 100 (Display/Information only)
  const lateRate = Number(((lateCount / TOTAL_PROGRAM_DAYS) * 100).toFixed(1));

  // Main Attendance Rate display based on (Present ÷ 80) × 100
  const attendanceRateDisplay = `${presentRate.toFixed(1)}%`;

  // Date formatting helpers
  const formatAttendanceDate = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return String(val);
    }
  };

  const formatAttendanceTime = (val) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-brand-primary via-brand-primary-dark to-[#002B54] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-32 h-32 bg-brand-secondary/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-100 text-xs font-semibold backdrop-blur-xs border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-brand-secondary" />
              <span>Week {PROGRAM_INFO.currentWeek} of {PROGRAM_INFO.totalWeeks} · Data Analytics Cohort</span>
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
              Resident ID: <span className="font-mono font-medium text-white">{studentIDDisplay}</span>
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

      {loading ? (
        <div className="space-y-6">
          <KPIGridSkeleton count={4} />
          <TableSkeleton rows={9} />
        </div>
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Overall Score</span>
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
              {overallScore !== null ? `${overallScore}%` : '0%'}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${gradeInfo.color}`}>
              {gradeInfo.letter}
            </span>
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">
            {overallScore !== null ? 'Weighted across 9 syllabus metrics' : 'No graded submissions yet'}
          </p>
        </div>

        {/* Cohort Rank */}
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Cohort Rank</span>
            <Award className="w-4 h-4 text-brand-secondary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-secondary">
              {rank || '—'}
            </span>
            {rank && <span className="text-xs font-medium text-brand-neutral-muted">Standing</span>}
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">
            {rank ? 'Active cohort performance standing' : 'Rank calculated after grading'}
          </p>
        </div>

        {/* Attendance Rate */}
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Attendance Rate</span>
            <Clock className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
              {attendanceRateDisplay}
            </span>
            <span className="badge-success text-[10px]">Tracked</span>
          </div>

          {/* Two small labels under the Attendance KPI: Present: X% and Late: Y% */}
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Present: {presentRate.toFixed(1)}%
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
              Late: {lateRate.toFixed(1)}%
            </span>
          </div>

          <p className="text-[11px] text-brand-neutral-muted mt-2">
            {presentCount} on-time of {TOTAL_PROGRAM_DAYS} days (Late: {lateCount}) · 80-day program
          </p>
        </div>

        {/* Curriculum Progress */}
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Curriculum Phase</span>
            <BookOpen className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-semibold text-brand-neutral">Data Analytics</span>
            <span className="badge-primary text-[10px]">Week {PROGRAM_INFO.currentWeek}</span>
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">4-month professional specialization</p>
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
            <p className="text-xs text-brand-neutral-muted">Enter today's session passcode</p>
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
            <p className="text-xs text-brand-neutral-muted">Technical or Professional homework</p>
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
            <p className="text-xs text-brand-neutral-muted">Monthly milestone projects</p>
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
            <p className="text-xs text-brand-neutral-muted">Submit LinkedIn or Twitter post links</p>
          </Link>
        </div>
      </div>

      {/* 9 Component Score Breakdown Table */}
      <div className="space-y-2">
        <ScoreTable performance={performance} totalScore={overallScore} />
      </div>

      {/* Two Detailed Live Sections: Attendance History & Class Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance History Section */}
        <div className="portal-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-primary" />
                <span>Attendance History</span>
              </h3>
              <p className="text-xs text-brand-neutral-muted mt-0.5">Live records from backend ATTENDANCE sheet</p>
            </div>
            <Link to="/student/attendance" className="text-xs font-medium text-brand-primary hover:underline flex items-center gap-1">
              <span>Mark</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Attendance Stats Bar: 4-Card Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
            <div className="bg-white p-2 rounded-lg border border-slate-100 text-center shadow-xs">
              <span className="text-[10px] text-emerald-700 font-medium block uppercase tracking-wide">Present Rate</span>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className="text-base font-bold text-emerald-600">{presentRate.toFixed(1)}%</span>
                <span className="text-[10px] text-slate-400 font-medium">({presentCount}/80)</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-100 text-center shadow-xs">
              <span className="text-[10px] text-amber-700 font-medium block uppercase tracking-wide">Late Rate</span>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className="text-base font-bold text-amber-600">{lateRate.toFixed(1)}%</span>
                <span className="text-[10px] text-amber-600/80 font-medium">({lateCount}/80)</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-100 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 font-medium block uppercase tracking-wide">Recorded Sessions</span>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className="text-base font-bold text-brand-primary">{presentCount + lateCount}</span>
                <span className="text-[10px] text-slate-400 font-medium">Tracked</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-100 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 font-medium block uppercase tracking-wide">Total Program</span>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className="text-base font-bold text-slate-700">80</span>
                <span className="text-[10px] text-slate-400 font-medium">Days</span>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto">
            {attendanceRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-brand-neutral-muted">
                No attendance records yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-slate-400 uppercase font-semibold">
                    <th className="py-2 px-2">Date & Time</th>
                    <th className="py-2 px-2 text-center">Week</th>
                    <th className="py-2 px-2 text-center">Day</th>
                    <th className="py-2 px-2">Session</th>
                    <th className="py-2 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceRecords.map((att, idx) => {
                    const isPresent = String(att.status || '').toLowerCase() === 'present';
                    const isLate = String(att.status || '').toLowerCase() === 'late';
                    const dateFormatted = formatAttendanceDate(att.date || att.timestamp);
                    const timeFormatted = formatAttendanceTime(att.date || att.timestamp);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-2 font-medium text-slate-800">
                          <div>{dateFormatted}</div>
                          {timeFormatted && <div className="text-[10px] text-slate-400 font-normal">{timeFormatted}</div>}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-600">
                          {att.weekNumber ?? att.week ?? '—'}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-600">
                          {att.dayNumber ?? att.day ?? '—'}
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 font-medium">
                          {att.sessionType || 'Physical'}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            isPresent
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : (isLate ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200')
                          }`}>
                            {att.status || 'Present'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Class Activities Section */}
        <div className="portal-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-secondary" />
                <span>Class Activities</span>
              </h3>
              <p className="text-xs text-brand-neutral-muted mt-0.5">Live participation records from backend CLASS_ACTIVITIES</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-brand-secondary border border-orange-200">
              {classActivities.length} Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            {classActivities.length === 0 ? (
              <div className="py-12 text-center text-xs text-brand-neutral-muted">
                No class activities recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-slate-400 uppercase font-semibold">
                    <th className="py-2 px-2 text-center">W / D</th>
                    <th className="py-2 px-2">Activity Title</th>
                    <th className="py-2 px-2">Type</th>
                    <th className="py-2 px-2 text-center">Tool</th>
                    <th className="py-2 px-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classActivities.map((act, idx) => {
                    const score = act.score !== undefined && act.score !== null ? act.score : '—';
                    const maxScore = act.maxScore !== undefined && act.maxScore !== null ? act.maxScore : 100;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                          W{act.weekNumber ?? act.week ?? '—'} D{act.dayNumber ?? act.day ?? '—'}
                        </td>
                        <td className="py-2.5 px-2 font-medium text-slate-800">
                          {act.activityTitle || act.title || 'Class Activity'}
                        </td>
                        <td className="py-2.5 px-2 text-slate-600">
                          {act.activityType || act.type || 'In-class'}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700">
                            {act.tool || 'Analytics'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-semibold text-brand-primary">
                          {score !== '—' ? `${score}/${maxScore}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
