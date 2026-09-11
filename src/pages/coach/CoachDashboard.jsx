import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCoachDashboard, getActiveAssignments } from '../../services/api';
import { PROGRAM_INFO, getGradeLetter } from '../../utils/constants';
import { CardSkeleton, TableSkeleton } from '../../components/SkeletonLoader';
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
  Award,
  TrendingUp,
  Pencil,
  Check,
  Search,
  ChevronRight,
  FilePlus,
  FileText,
  ClipboardList
} from 'lucide-react';

export default function CoachDashboard() {
  const { user, updateUserProfile } = useAuth();
  const [students, setStudents] = useState([]);
  const [studentsPerformance, setStudentsPerformance] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [activeAssignmentsCount, setActiveAssignmentsCount] = useState(0);
  const [showBelow70Only, setShowBelow70Only] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
      setLoading(true);
      try {
        const [dashRes, asgnRes] = await Promise.all([
          getCoachDashboard(),
          getActiveAssignments().catch(() => null)
        ]);

        if (dashRes && dashRes.success !== false) {
          const payload = dashRes.data || dashRes;
          const stdsList = payload.students || [];
          const perfList = payload.performance || payload.studentsPerformance || [];
          const subsList = payload.submissions || payload.pendingSubmissions || [];
          const postsList = payload.socialPosts || payload.pendingPosts || [];

          setStudents(Array.isArray(stdsList) ? stdsList : []);
          setStudentsPerformance(Array.isArray(perfList) ? perfList : []);
          setPendingSubmissions(Array.isArray(subsList) ? subsList.filter(s => s.status === 'Ungraded' || s.status === 'Pending') : []);
          setPendingPosts(Array.isArray(postsList) ? postsList.filter(p => p.status === 'Pending' || p.status === 'Submitted') : []);

          if (payload.activeAssignmentsCount !== undefined) {
            setActiveAssignmentsCount(payload.activeAssignmentsCount);
          }
        }

        if (asgnRes && asgnRes.success !== false) {
          const list = Array.isArray(asgnRes) ? asgnRes : (asgnRes.data || asgnRes.assignments || []);
          const count = list.filter(a => !(a.status && a.status.toLowerCase() === 'closed') && !a.isClosed).length || list.length;
          setActiveAssignmentsCount(count);
        }
      } catch (err) {
        console.error('Error loading coach dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate Class Average Score from getAllStudentsPerformance()
  const validScores = studentsPerformance
    .map(p => p.finalScore !== undefined && p.finalScore !== null ? Number(p.finalScore) : (p.overallScore !== undefined && p.overallScore !== null ? Number(p.overallScore) : null))
    .filter(s => s !== null && !isNaN(s));

  const classAvgScore = validScores.length > 0
    ? Math.round(validScores.reduce((sum, s) => sum + s, 0) / validScores.length)
    : null;

  // Calculate Average Attendance from getAllStudentsPerformance() or students
  const validAttendances = studentsPerformance
    .map(p => p.attendanceRate !== undefined && p.attendanceRate !== null ? Number(p.attendanceRate) : (p.attendanceScore !== undefined && p.attendanceScore !== null ? Number(p.attendanceScore) : null))
    .filter(a => a !== null && !isNaN(a));

  const avgAttendance = validAttendances.length > 0
    ? Math.round(validAttendances.reduce((sum, a) => sum + a, 0) / validAttendances.length)
    : (students.some(s => s.attendanceRate !== undefined && s.attendanceRate !== null)
      ? Math.round(students.reduce((sum, s) => sum + (Number(s.attendanceRate) || 0), 0) / students.length)
      : null);

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Coach';

  // Merge students with performance table
  const combinedList = students.map(s => {
    const perf = studentsPerformance.find(p => p.studentID === s.studentID) || {};
    const finalScore = perf.finalScore !== undefined && perf.finalScore !== null
      ? perf.finalScore
      : (perf.overallScore ?? s.overallScore ?? null);
    const rank = perf.rank || s.rank || null;
    const grade = perf.grade || (finalScore !== null ? getGradeLetter(finalScore).letter : '—');
    const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || perf.studentName || s.studentID;

    return {
      studentID: s.studentID,
      name: sName,
      classGroup: s.classGroup || perf.classGroup || '—',
      finalScore: finalScore,
      rank: rank,
      grade: grade
    };
  });

  const displayList = combinedList.length > 0
    ? combinedList
    : studentsPerformance.map(p => ({
        studentID: p.studentID,
        name: p.studentName || p.name || p.studentID,
        classGroup: p.classGroup || '—',
        finalScore: p.finalScore ?? p.overallScore ?? null,
        rank: p.rank || null,
        grade: p.grade || (p.finalScore ? getGradeLetter(p.finalScore).letter : '—')
      }));

  const filteredList = displayList.filter(item => {
    const q = search.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.studentID && item.studentID.toLowerCase().includes(q)) ||
      (item.classGroup && item.classGroup.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-secondary via-brand-secondary-dark to-[#B45309] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-4">
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

            {/* Quick Action Buttons - Aligned Side by Side Under the Text */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/coach/create-assignment"
                className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center gap-2 text-xs"
              >
                <FilePlus className="w-4 h-4" />
                <span>Create Assignment</span>
              </Link>
              <Link
                to="/coach/manage-assignments"
                className="bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-xs transition-all flex items-center gap-2 text-xs"
              >
                <FileText className="w-4 h-4" />
                <span>Manage Assignments</span>
              </Link>
              <Link
                to="/coach/attendance-code"
                className="bg-white hover:bg-orange-50 text-brand-secondary-dark font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center gap-2 text-xs"
              >
                <QrCode className="w-4 h-4" />
                <span>Attendance Code</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <TableSkeleton rows={8} />
        </div>
      ) : (
        <>
          {/* KPI Overview Cards — 6 Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Students */}
            <div className="portal-card">
              <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
                <span className="text-xs font-medium text-slate-500 tracking-wide">Total Students</span>
                <Users className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
                  {students.length}
                </span>
                <span className="badge-primary text-[10px]">Roster</span>
              </div>
              <p className="text-[11px] text-brand-neutral-muted mt-2">Enrolled residents</p>
            </div>

            {/* Active Assignments */}
            <Link to="/coach/manage-assignments" className="portal-card hover:border-brand-primary transition-colors block">
              <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
                <span className="text-xs font-medium text-slate-500 tracking-wide">Active Tasks</span>
                <FileText className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
                  {activeAssignmentsCount}
                </span>
                <span className="badge-primary text-[10px]">Live</span>
              </div>
              <p className="text-[11px] text-brand-neutral-muted mt-2">Manage syllabus tasks →</p>
            </Link>

            {/* Pending Submissions */}
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
              <p className="text-[11px] text-brand-neutral-muted mt-2">Assignments to grade</p>
            </div>

            {/* Pending Social Posts */}
            <div className="portal-card">
              <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
                <span className="text-xs font-medium text-slate-500 tracking-wide">Pending Posts</span>
                <CheckCircle className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
                  {pendingPosts.length}
                </span>
                {pendingPosts.length > 0 ? (
                  <span className="badge-primary text-[10px]">Pending</span>
                ) : (
                  <span className="text-xs text-brand-neutral-muted">Up to date</span>
                )}
              </div>
              <p className="text-[11px] text-brand-neutral-muted mt-2">LinkedIn/Twitter shares</p>
            </div>

            {/* Class Average Score */}
            <div className="portal-card">
              <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
                <span className="text-xs font-medium text-slate-500 tracking-wide">Class Avg Score</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-semibold text-emerald-600">
                  {classAvgScore !== null ? `${classAvgScore}%` : '—'}
                </span>
                {classAvgScore !== null && <span className="badge-success text-[10px]">Cohort Mean</span>}
              </div>
              <p className="text-[11px] text-brand-neutral-muted mt-2">From final scores</p>
            </div>

            {/* Average Attendance */}
            <div className="portal-card">
              <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
                <span className="text-xs font-medium text-slate-500 tracking-wide">Avg Attendance</span>
                <Clock className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
                  {avgAttendance !== null ? `${avgAttendance}%` : '—'}
                </span>
                {avgAttendance !== null && <span className="badge-success text-[10px]">Tracked</span>}
              </div>
              <p className="text-[11px] text-brand-neutral-muted mt-2">Punctuality rate</p>
            </div>
          </div>

          {/* Class Performance Table */}
          <div className="portal-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <span>Class Performance Table</span>
                </h2>
                <p className="text-xs text-brand-neutral-muted mt-0.5">Live resident performance from backend</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search resident or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="text-xs py-1.5 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredList.length === 0 ? (
                <div className="py-12 text-center text-xs text-brand-neutral-muted">
                  No data available.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-slate-400 uppercase font-semibold">
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Class Group</th>
                      <th className="py-2.5 px-3 text-center">Final Score</th>
                      <th className="py-2.5 px-3 text-center">Rank</th>
                      <th className="py-2.5 px-3 text-right">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.map((st, idx) => {
                      const hasScore = st.finalScore !== null && st.finalScore !== undefined;
                      const grade = hasScore ? getGradeLetter(st.finalScore) : { letter: st.grade || '—', color: 'text-slate-500 bg-slate-50 border-slate-200' };

                      return (
                        <tr key={st.studentID || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 font-mono font-medium text-brand-primary">
                            {st.studentID}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {st.name}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {st.classGroup}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">
                            {hasScore ? `${st.finalScore}%` : '0%'}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-brand-secondary">
                            {st.rank ? `#${st.rank}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${grade.color}`}>
                              {grade.letter}
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

          {/* Assignment Compliance Overview Card */}
          {(() => {
            const complianceList = students.map(s => {
              const perf = studentsPerformance.find(p => p.studentID === s.studentID) || {};
              const techSub = Number(s.technicalAssignmentsSubmitted ?? perf.technicalAssignmentsSubmitted ?? s.techSubmissions ?? 0);
              const techTot = Number(s.technicalAssignmentsTotal ?? perf.technicalAssignmentsTotal ?? 0);
              const techRate = techTot > 0 ? Math.round((techSub / techTot) * 100) : Number(s.techRate ?? perf.techRate ?? 0);

              const profSub = Number(s.professionalAssignmentsSubmitted ?? perf.professionalAssignmentsSubmitted ?? s.profSubmissions ?? 0);
              const profTot = Number(s.professionalAssignmentsTotal ?? perf.professionalAssignmentsTotal ?? 0);
              const profRate = profTot > 0 ? Math.round((profSub / profTot) * 100) : Number(s.profRate ?? perf.profRate ?? 0);

              const overallRate = (techTot + profTot) > 0
                ? Math.round(((techSub + profSub) / (techTot + profTot)) * 100)
                : Number(s.complianceRate ?? perf.complianceRate ?? 0);
              const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || perf.studentName || s.studentID;

              return {
                studentID: s.studentID,
                name: sName,
                classGroup: s.classGroup || perf.classGroup || '—',
                techRate: Math.min(100, Math.max(0, techRate)),
                profRate: Math.min(100, Math.max(0, profRate)),
                overallRate: Math.min(100, Math.max(0, overallRate))
              };
            }).sort((a, b) => a.overallRate - b.overallRate);

            const filteredCompliance = showBelow70Only
              ? complianceList.filter(s => s.overallRate < 70)
              : complianceList;

            const getComplianceColor = (rate) => {
              if (rate >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
              if (rate >= 70) return 'text-blue-700 bg-blue-50 border-blue-200';
              if (rate >= 50) return 'text-orange-700 bg-orange-50 border-orange-200';
              return 'text-red-700 bg-red-50 border-red-200';
            };

            return (
              <div className="portal-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-brand-primary" />
                      <span>Assignment Compliance Overview</span>
                    </h2>
                    <p className="text-xs text-brand-neutral-muted mt-0.5">
                      Student submission rate sorted by lowest compliance first (Tech 60% / Prof 40%)
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={showBelow70Only}
                        onChange={(e) => setShowBelow70Only(e.target.checked)}
                        className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                      />
                      <span>Show only students below 70%</span>
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {filteredCompliance.length === 0 ? (
                    <div className="py-8 text-center text-xs text-brand-neutral-muted">
                      No students found matching filter criteria.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/80 text-slate-400 uppercase font-semibold">
                          <th className="py-2.5 px-3">Student</th>
                          <th className="py-2.5 px-3 text-center">Tech %</th>
                          <th className="py-2.5 px-3 text-center">Prof %</th>
                          <th className="py-2.5 px-3 text-center">Overall Compliance %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCompliance.map((st, idx) => (
                          <tr key={st.studentID || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-800">{st.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {st.studentID} {st.classGroup !== '—' && `· ${st.classGroup}`}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${getComplianceColor(st.techRate)}`}>
                                {st.techRate}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${getComplianceColor(st.profRate)}`}>
                                {st.profRate}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-bold border ${getComplianceColor(st.overallRate)}`}>
                                {st.overallRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Instructor Actions Matrix */}
      <div className="portal-card">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Instructor Grading & Evaluation Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/coach/create-assignment"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-brand-primary hover:bg-blue-50/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-brand-primary group-hover:bg-brand-primary group-hover:text-white flex items-center justify-center transition-colors">
                <FilePlus className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-brand-primary">
                Create Assignment
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">Publish syllabus tasks & files</p>
          </Link>

          <Link
            to="/coach/manage-assignments"
            className="p-4 rounded-xl border border-slate-200/80 hover:border-brand-primary hover:bg-blue-50/30 transition-all flex flex-col justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm text-slate-800 group-hover:text-brand-primary">
                Manage Assignments
              </span>
            </div>
            <p className="text-xs text-brand-neutral-muted">Notify students & close tasks</p>
          </Link>
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
            <p className="text-xs text-brand-neutral-muted">Broadcast 6-char session passcode</p>
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
            <p className="text-xs text-brand-neutral-muted">Review student files and score</p>
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
            <p className="text-xs text-brand-neutral-muted">Live questions, exercises & drills</p>
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
            <p className="text-xs text-brand-neutral-muted">Monthly module milestone grades</p>
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
            <p className="text-xs text-brand-neutral-muted">Team sprint progress scoring</p>
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
            <p className="text-xs text-brand-neutral-muted">4 rubric criteria + Q&A defense</p>
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
            <p className="text-xs text-brand-neutral-muted">6 behavioral competency criteria</p>
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
            <p className="text-xs text-brand-neutral-muted">Verify LinkedIn/Twitter URLs</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
