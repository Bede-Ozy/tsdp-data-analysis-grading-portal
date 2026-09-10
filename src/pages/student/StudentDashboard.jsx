import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentPerformance, getStudentAttendance, getStudentClassActivities } from '../../services/api';
import { PROGRAM_INFO, getGradeLetter } from '../../utils/constants';
import ScoreTable from '../../components/ScoreTable';
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
      try {
        const studentID = user?.studentID || (user?.studentNumber ? `TSDP2026-RES-${String(user.studentNumber).padStart(3, '0')}` : '');
        if (!studentID) {
          setLoading(false);
          return;
        }

        const [perfRes, attRes, actRes] = await Promise.all([
          getStudentPerformance(studentID).catch(err => ({ success: false, error: err.message })),
          getStudentAttendance(studentID).catch(err => ({ success: false, error: err.message })),
          getStudentClassActivities(studentID).catch(err => ({ success: false, error: err.message }))
        ]);

        // 1. Performance Data
        if (perfRes) {
          const pData = perfRes.data || (perfRes.success ? perfRes : (perfRes.finalScore !== undefined || perfRes.overallScore !== undefined ? perfRes : null));
          setPerformance(pData);
        }

        // 2. Attendance Data
        if (attRes) {
          const aData = attRes.data || (attRes.success ? attRes : (attRes.records || attRes.attendanceRate !== undefined ? attRes : null));
          setAttendanceData(aData);
        }

        // 3. Class Activities
        if (actRes) {
          const list = Array.isArray(actRes)
            ? actRes
            : (Array.isArray(actRes.data)
              ? actRes.data
              : (Array.isArray(actRes.records)
                ? actRes.records
                : (Array.isArray(actRes.activities) ? actRes.activities : [])));
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

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading live performance records from backend..." />;
  }

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

  const presentCount = attendanceData?.presentCount !== undefined && attendanceData?.presentCount !== null
    ? attendanceData.presentCount
    : attendanceRecords.filter(r => String(r.status || '').toLowerCase() === 'present').length;

  const lateCount = attendanceData?.lateCount !== undefined && attendanceData?.lateCount !== null
    ? attendanceData.lateCount
    : attendanceRecords.filter(r => String(r.status || '').toLowerCase() === 'late').length;

  const totalDays = attendanceData?.totalDays !== undefined && attendanceData?.totalDays !== null
    ? attendanceData.totalDays
    : attendanceRecords.length;

  // 9-Component Score Breakdown for ScoreTable
  const scoreBreakdown = {
    technicalAssignments: {
      score: performance?.technicalAssignmentsScore ?? performance?.breakdown?.technicalAssignments?.score ?? null
    },
    professionalAssignments: {
      score: performance?.professionalAssignmentsScore ?? performance?.breakdown?.professionalAssignments?.score ?? null
    },
    classActivities: {
      score: performance?.classActivitiesScore ?? performance?.breakdown?.classActivities?.score ?? null
    },
    socialMedia: {
      score: performance?.socialMediaScore ?? performance?.breakdown?.socialMedia?.score ?? null
    },
    moduleProjects: {
      score: performance?.moduleProjectsScore ?? performance?.breakdown?.moduleProjects?.score ?? null
    },
    capstoneProjects: {
      score: performance?.capstoneScore ?? performance?.breakdown?.capstoneProjects?.score ?? null
    },
    groupPresentations: {
      score: performance?.groupPresentationsScore ?? performance?.breakdown?.groupPresentations?.score ?? null
    },
    attendance: {
      score: performance?.attendanceScore ?? performance?.breakdown?.attendance?.score ?? attendanceRate
    },
    softSkills: {
      score: performance?.softSkillsScore ?? performance?.breakdown?.softSkills?.score ?? null
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
              {attendanceRate !== null ? `${attendanceRate}%` : '0%'}
            </span>
            {attendanceRate !== null && <span className="badge-success text-[10px]">Tracked</span>}
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">
            {totalDays > 0 ? `${presentCount} of ${totalDays} sessions attended` : 'No attendance recorded yet'}
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
        <ScoreTable breakdown={scoreBreakdown} totalScore={overallScore} />
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

          {/* Attendance Stats Bar */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-center">
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Present</span>
              <span className="text-base font-bold text-emerald-600">{presentCount}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Late</span>
              <span className="text-base font-bold text-amber-600">{lateCount}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Total Days</span>
              <span className="text-base font-bold text-slate-800">{totalDays}</span>
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
                    <th className="py-2 px-2">Date</th>
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
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-2 font-medium text-slate-800">
                          {att.date || att.timestamp || '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600">
                          {att.weekNumber ?? att.week ?? '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600">
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
    </div>
  );
}
