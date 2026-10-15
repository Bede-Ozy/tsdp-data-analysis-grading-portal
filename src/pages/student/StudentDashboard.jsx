import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentDashboard, getStudentPendingAssignments, getStudentGroupRank, clearApiCache } from '../../services/api';
import { PROGRAM_INFO, getGradeLetter, formatScore } from '../../utils/constants';
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
  AlertTriangle,
  Trophy,
  Users,
  RotateCw
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, updateUserProfile } = useAuth();
  const [performance, setPerformance] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [classActivities, setClassActivities] = useState([]);
  const [assignmentsState, setAssignmentsState] = useState({
    pending: [],
    overdue: [],
    submitted: []
  });
  const [groupRankData, setGroupRankData] = useState(null);
  const [socialSubmissions, setSocialSubmissions] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(PROGRAM_INFO.currentWeek || 10);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');

  const handleSaveName = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateUserProfile({ name: nameInput.trim() });
    }
    setIsEditingName(false);
  };

  const loadData = useCallback(async () => {
    const studentID = user?.studentID || (user?.studentNumber ? `TSDP2026-RES-${String(user.studentNumber).padStart(3, '0')}` : '');
    if (!studentID) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [dashRes, pendingRes, groupRankRes] = await Promise.all([
        getStudentDashboard(studentID),
        getStudentPendingAssignments(studentID || user?.studentNumber).catch(() => null),
        getStudentGroupRank(studentID || user?.studentNumber).catch(() => null)
      ]);

      let pList = [];
      let oList = [];
      let sList = [];

      // 1. Trust backend arrays directly (pending, overdue, submitted)
      if (pendingRes && pendingRes.success !== false) {
        const root = pendingRes.data && (pendingRes.data.pending || pendingRes.data.overdue || pendingRes.data.submitted) 
          ? pendingRes.data 
          : pendingRes;
        
        if (Array.isArray(root.pending)) pList = [...root.pending];
        if (Array.isArray(root.overdue)) oList = [...root.overdue];
        if (Array.isArray(root.submitted)) sList = [...root.submitted];

        // Fallback if returned as flat array
        if (Array.isArray(root) && pList.length === 0 && oList.length === 0 && sList.length === 0) {
          pList = [...root];
        }
      }

      if (dashRes && dashRes.success !== false) {
        const payload = dashRes.data || dashRes;
        
        if (payload.currentWeek) {
          setCurrentWeek(Number(payload.currentWeek));
        }

        // Performance Data
        const pData = payload.performance || (payload.finalScore !== undefined || payload.overallScore !== undefined ? payload : null);
        setPerformance(pData);

        // Attendance Data
        const aData = payload.attendance || (payload.records || payload.attendanceRate !== undefined ? payload : null);
        setAttendanceData(aData);

        // Class Activities
        const act = payload.activities || payload.classActivities || [];
        const list = Array.isArray(act) ? act : (act.records || act.data || []);
        setClassActivities(list);

        // Submissions from dashboard
        const subs = payload.submissions || payload.pendingSubmissions || [];
        subs.forEach(s => {
          if (s && !sList.some(item => (item.assignmentID || item.id) === (s.assignmentID || s.id))) {
            sList.push(s);
          }
        });
      }

      // Check local storage module submissions
      try {
        const localMods = JSON.parse(localStorage.getItem('tsdp_module_project_submissions') || '[]');
        localMods.forEach(m => {
          if (m.studentID === studentID || m.studentID === user?.studentNumber) {
            if (!sList.some(s => s.type === 'ModuleProject' && Number(s.monthNumber) === Number(m.monthNumber))) {
              sList.push({
                assignmentID: m.projectID,
                title: m.projectTitle,
                tool: m.tool,
                monthNumber: m.monthNumber,
                type: 'ModuleProject',
                submittedAt: m.submittedAt,
                fileURL: m.files?.[0]?.url || ''
              });
            }
          }
        });
      } catch (e) {}

      // Check local storage social media submissions
      let studentSocialSubs = [];
      try {
        const rawSocial = localStorage.getItem('tsdp_social_media_submissions');
        const localSocial = rawSocial ? JSON.parse(rawSocial) : [];
        studentSocialSubs = localSocial.filter(s =>
          s.studentID === studentID ||
          s.studentNumber === user?.studentNumber ||
          String(s.studentID).trim().toLowerCase() === String(studentID).trim().toLowerCase() ||
          String(s.studentNumber).trim().toLowerCase() === String(user?.studentNumber).trim().toLowerCase()
        );
      } catch (e) {}
      setSocialSubmissions(studentSocialSubs);

      // Do NOT re-derive status or overdue items on the frontend.
      // Trust the backend arrays. Ensure submitted items are excluded from pending and overdue.
      const submittedIdSet = new Set(sList.map(s => String(s.assignmentID || s.id || '').trim().toLowerCase()).filter(Boolean));
      pList = pList.filter(a => !submittedIdSet.has(String(a.assignmentID || a.id || '').trim().toLowerCase()));
      oList = oList.filter(a => !submittedIdSet.has(String(a.assignmentID || a.id || '').trim().toLowerCase()));

      setAssignmentsState({
        pending: pList,
        overdue: oList,
        submitted: sList
      });



      // Process Student Group Rank Data from Backend
      if (groupRankRes && groupRankRes.success !== false) {
        const root = groupRankRes.data || groupRankRes;
        const totalGroups = Array.isArray(root.fullLeaderboard) && root.fullLeaderboard.length > 0 
          ? root.fullLeaderboard.length 
          : (root.totalGroups ?? root.totalTeams ?? 4);

        setGroupRankData({
          groupName: root.myGroup || root.groupName || root.group || user?.classGroup || 'Your Group',
          rank: root.myRank !== undefined && root.myRank !== null ? root.myRank : (root.rank || null),
          totalGroups: totalGroups,
          average: root.myAverageScore !== undefined ? root.myAverageScore : (root.average ?? root.averageScore ?? 0),
          total: root.myTotalScore !== undefined ? root.myTotalScore : (root.total ?? root.totalScore ?? 0),
          latest: root.myLatestScore !== undefined ? root.myLatestScore : (root.latest ?? root.latestScore ?? 0),
          presentationCount: root.presentationCount ?? 0,
          leadingGroup: root.leadingGroup || null,
          leadingScore: root.leadingScore !== undefined ? root.leadingScore : null
        });
      } else {
        setGroupRankData(null);
      }
    } catch (err) {
      console.error('Error loading student dashboard records:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    clearApiCache();
    await loadData();
    setIsRefreshing(false);
  };

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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-100 text-xs font-semibold backdrop-blur-xs border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-brand-secondary" />
              <span>Week {currentWeek} of {PROGRAM_INFO.totalWeeks} · Data Analytics Cohort</span>
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

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-medium text-xs sm:text-sm border border-white/20 backdrop-blur-xs transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              title="Refresh data from backend"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>

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

      {/* Program Round-Up Revision & Challenge Feedback Callout Banner */}
      <div className="bg-gradient-to-r from-brand-primary via-orange-500 to-amber-500 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-orange-400/40 animate-fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-200" /> Round-Up Revision Request
            </span>
            <span className="text-xs font-semibold text-orange-100 hidden sm:inline">Have topics you need us to revisit?</span>
          </div>
          <h3 className="text-base font-bold text-white">
            Submit Your Challenge Feedback for Final Recap Clinics
          </h3>
          <p className="text-xs text-orange-100 max-w-xl font-normal leading-relaxed">
            Tell the coaches what specific concepts in SQL, Power BI, Python, or Excel you need reviewed as we round up the program.
          </p>
        </div>
        <Link
          to="/student/challenge-feedback"
          className="bg-white hover:bg-orange-50 text-orange-600 font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          <span>Fill Feedback Form</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Active Deliverable Notification Banner */}
      {!loading && (assignmentsState.pending.length + assignmentsState.overdue.length) > 0 && (() => {
        const dueList = [...assignmentsState.overdue, ...assignmentsState.pending];
        const totalDue = dueList.length;
        const first = dueList[0];
        const isMod = first.type === 'ModuleProject';
        const isSoc = first.type === 'SocialMedia';
        const targetUrl = isSoc
          ? `/student/submit-social-media?assignmentID=${first.assignmentID || first.id}`
          : isMod
          ? `/student/submit-module-project?month=${first.monthNumber || 1}`
          : `/student/submit-assignment?assignmentID=${first.assignmentID || first.id}`;

        return (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-orange-50/40 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 text-brand-secondary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                    Active Syllabus Deliverable Due
                  </span>
                  <span className="badge-secondary text-[10px]">
                    {totalDue} Task{totalDue > 1 ? 's' : ''} Pending
                  </span>
                  {assignmentsState.overdue.length > 0 && (
                    <span className="badge-danger text-[10px] bg-red-50 text-red-700 border-red-200">
                      {assignmentsState.overdue.length} Overdue
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {first.title || first.assignmentTitle}
                  {isSoc && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
                      📱 Social Media Post
                    </span>
                  )}
                  {isMod && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
                      Monthly Module Project
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Link
              to={targetUrl}
              className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto flex-shrink-0"
            >
              <span>Submit Solution Now</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        );
      })()}

      {loading ? (
        <div className="space-y-6">
          <KPIGridSkeleton count={4} />
          <TableSkeleton rows={9} />
        </div>
      ) : (
        <>
          {/* Assignments Due */}
            {(() => {
              const overdueCount = assignmentsState.overdue.length;
              const pendingCount = assignmentsState.pending.length;
              const submittedCount = assignmentsState.submitted.length;
              const totalActive = overdueCount + pendingCount;

              return (
                <div className="portal-card flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📝</span>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Assignments Due</h2>
                      </div>
                      {totalActive > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {overdueCount > 0 && (
                            <span className="badge-danger text-[10px] bg-red-50 text-red-700 border-red-200 font-bold">
                              {overdueCount} Overdue
                            </span>
                          )}
                          {pendingCount > 0 && (
                            <span className="badge-primary text-[10px]">
                              {pendingCount} Pending
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          All Submitted ✅
                        </span>
                      )}
                    </div>

                    {/* Overdue Warning Alert - ONLY shown when overdueCount > 0 */}
                    {overdueCount > 0 && (
                      <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700 font-semibold">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span>
                          You have {overdueCount} overdue assignment{overdueCount > 1 ? 's' : ''}!
                        </span>
                      </div>
                    )}

                    {/* Pending & Overdue Deliverables List */}
                    <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                      {totalActive === 0 ? (
                        <div className="py-6 text-center text-xs text-brand-neutral-muted space-y-2">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-50">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          </div>
                          <p className="text-emerald-800 font-bold text-sm">
                            All assignments submitted ✅
                          </p>
                          <p className="text-slate-500 text-xs">Great job staying on track! You have no pending or overdue deliverables.</p>
                        </div>
                      ) : (
                        <>
                          {/* 1. Overdue Items (Red "Overdue" Badge) */}
                          {assignmentsState.overdue.map((asgn, idx) => {
                            const asgnID = asgn.assignmentID || asgn.id;
                            const title = asgn.title || asgn.assignmentTitle || 'Class Assignment';
                            const tool = asgn.tool || (asgn.type === 'SocialMedia' ? 'LinkedIn' : (asgn.category === 'Technical' ? 'Excel' : 'Technical'));
                            const due = asgn.dueDate ? new Date(asgn.dueDate) : null;
                            const isModuleProject = asgn.type === 'ModuleProject';
                            const isSocialMedia = asgn.type === 'SocialMedia';

                            const submitTarget = isSocialMedia
                              ? `/student/submit-social-media?assignmentID=${asgnID}`
                              : isModuleProject
                              ? `/student/submit-module-project?month=${asgn.monthNumber || 1}`
                              : `/student/submit-assignment?assignmentID=${asgnID}`;

                            return (
                              <div
                                key={asgnID || `overdue-${idx}`}
                                className="p-3 rounded-xl border bg-red-50/60 border-red-200 hover:bg-red-50/80 flex items-center justify-between gap-3 transition-colors"
                              >
                                <div className="overflow-hidden space-y-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {isSocialMedia ? (
                                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                                        📱 Social Media {asgn.weekNumber ? `(W${asgn.weekNumber})` : ''}
                                      </span>
                                    ) : isModuleProject ? (
                                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                                        📁 Module Project {asgn.monthNumber ? `(Month ${asgn.monthNumber})` : ''}
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-brand-primary text-[10px] font-bold">
                                        📝 Assignment {asgn.weekNumber ? `(W${asgn.weekNumber}D${asgn.dayNumber || 1})` : ''}
                                      </span>
                                    )}
                                    <span className="font-semibold text-xs text-slate-800 truncate">
                                      {title}
                                    </span>
                                    {tool && (
                                      <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-medium text-slate-600 border border-slate-200">
                                        {tool}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border bg-red-50 text-red-700 border-red-200">
                                      <Clock className="w-3 h-3" />
                                      <span>Overdue</span>
                                    </span>
                                    {due && (
                                      <span className="text-[10px] text-red-600 font-medium">
                                        Due {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <Link
                                  to={submitTarget}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-red-700 bg-red-100/80 hover:bg-red-200/80 rounded-lg flex-shrink-0 border border-red-200 flex items-center gap-1 transition-colors"
                                >
                                  <span>Submit Late</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            );
                          })}

                          {/* 2. Pending Items ("Pending" Badge) */}
                          {assignmentsState.pending.map((asgn, idx) => {
                            const asgnID = asgn.assignmentID || asgn.id;
                            const title = asgn.title || asgn.assignmentTitle || 'Class Assignment';
                            const tool = asgn.tool || (asgn.type === 'SocialMedia' ? 'LinkedIn' : (asgn.category === 'Technical' ? 'Excel' : 'Technical'));
                            const due = asgn.dueDate ? new Date(asgn.dueDate) : null;
                            const isModuleProject = asgn.type === 'ModuleProject';
                            const isSocialMedia = asgn.type === 'SocialMedia';

                            const submitTarget = isSocialMedia
                              ? `/student/submit-social-media?assignmentID=${asgnID}`
                              : isModuleProject
                              ? `/student/submit-module-project?month=${asgn.monthNumber || 1}`
                              : `/student/submit-assignment?assignmentID=${asgnID}`;

                            return (
                              <div
                                key={asgnID || `pending-${idx}`}
                                className="p-3 rounded-xl border bg-slate-50 border-slate-200/80 hover:bg-slate-100/70 flex items-center justify-between gap-3 transition-colors"
                              >
                                <div className="overflow-hidden space-y-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {isSocialMedia ? (
                                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                                        📱 Social Media {asgn.weekNumber ? `(W${asgn.weekNumber})` : ''}
                                      </span>
                                    ) : isModuleProject ? (
                                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                                        📁 Module Project {asgn.monthNumber ? `(Month ${asgn.monthNumber})` : ''}
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-brand-primary text-[10px] font-bold">
                                        📝 Assignment {asgn.weekNumber ? `(W${asgn.weekNumber}D${asgn.dayNumber || 1})` : ''}
                                      </span>
                                    )}
                                    <span className="font-semibold text-xs text-slate-800 truncate">
                                      {title}
                                    </span>
                                    {tool && (
                                      <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-medium text-slate-600 border border-slate-200">
                                        {tool}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                                      <Clock className="w-3 h-3" />
                                      <span>Pending</span>
                                    </span>
                                    {due ? (
                                      <span className="text-[10px] text-slate-500 font-medium">
                                        Due {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        Upcoming deliverable
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <Link
                                  to={submitTarget}
                                  className="btn-primary py-1.5 px-3 text-xs font-semibold flex-shrink-0 flex items-center gap-1"
                                >
                                  <span>Submit Now</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>

                    {/* 3. Submitted Deliverables — Separate Section */}
                    {submittedCount > 0 && (
                      <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Submitted Deliverables</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              {submittedCount}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">Recorded on backend</span>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {assignmentsState.submitted.map((asgn, idx) => {
                            const asgnID = asgn.assignmentID || asgn.id || `SUB-${idx}`;
                            const title = asgn.title || asgn.assignmentTitle || asgn.projectTitle || 'Assignment';
                            const tool = asgn.tool || (asgn.type === 'SocialMedia' ? 'Social Media' : (asgn.type === 'ModuleProject' ? 'Module Project' : 'Technical'));
                            const score = asgn.score !== undefined && asgn.score !== null ? asgn.score : null;
                            const maxScore = asgn.maxScore || 100;
                            const status = asgn.status || 'Submitted';

                            return (
                              <div
                                key={asgnID || `submitted-${idx}`}
                                className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/70 flex items-center justify-between gap-3 transition-colors"
                              >
                                <div className="overflow-hidden space-y-0.5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-semibold text-xs text-slate-800 truncate">
                                      {title}
                                    </span>
                                    {tool && (
                                      <span className="px-1.5 py-0.2 rounded bg-white text-[10px] font-medium text-slate-600 border border-slate-200">
                                        {tool}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Submitted ✅</span>
                                    </span>
                                    {asgn.weekNumber && (
                                      <span>Week {asgn.weekNumber}{asgn.dayNumber ? ` Day ${asgn.dayNumber}` : ''}</span>
                                    )}
                                    {asgn.submittedAt && (
                                      <span className="text-[10px] text-slate-400">
                                        {new Date(asgn.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {score !== null ? (
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-white text-emerald-700 border border-emerald-200 shadow-2xs">
                                      {score}/{maxScore}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-medium text-slate-500 italic">
                                      {status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Direct submission to Google Drive</span>
                    <Link to="/student/submit-assignment" className="text-brand-primary font-semibold hover:underline">
                      Open Submissions →
                    </Link>
                  </div>
                </div>
              );
            })()}

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="portal-card">
          <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
            <span className="text-xs font-medium text-slate-500 tracking-wide">Overall Score</span>
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
              {formatScore(overallScore)}
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
          <div className="flex items-baseline gap-2 flex-wrap">
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
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-semibold text-brand-neutral">
              {attendanceRateDisplay}
            </span>
            <span className="badge-success text-[10px]">Tracked</span>
          </div>

          {/* Two small labels under the Attendance KPI: Present: X% and Late: Y% */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
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
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-semibold text-brand-neutral">Data Analytics</span>
            <span className="badge-primary text-[10px]">Week {currentWeek}</span>
          </div>
          <p className="text-[11px] text-brand-neutral-muted mt-2">4-month professional specialization</p>
        </div>
      </div>

      {/* Your Group Rank Card */}
      {groupRankData && (
        <div className="portal-card bg-gradient-to-br from-white via-cyan-50/20 to-blue-50/30 border-cyan-200/80 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center text-lg shadow-xs">
                🏆
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-800 tracking-tight">Your Group Rank</h2>
                  <span className="badge-primary text-[10px] font-bold">
                    {groupRankData.groupName}
                  </span>
                </div>
                <p className="text-xs text-brand-neutral-muted">Group presentation standings & cohort leaderboard (10% program weight)</p>
              </div>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Rank:{' '}
              {groupRankData.rank ? (
                <>
                  <strong className="text-brand-secondary font-bold text-sm">#{groupRankData.rank}</strong> of{' '}
                  {groupRankData.totalGroups}
                </>
              ) : (
                <span className="text-slate-400 font-semibold italic">Pending evaluation</span>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-center shadow-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Group Rank</span>
              <span className="text-xl sm:text-2xl font-bold text-brand-secondary mt-0.5 block">
                {groupRankData.rank ? `#${groupRankData.rank}` : '—'}
                {groupRankData.rank && (
                  <span className="text-xs font-normal text-slate-400"> of {groupRankData.totalGroups}</span>
                )}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-center shadow-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Group Average</span>
              <span className="text-xl sm:text-2xl font-bold text-brand-primary mt-0.5 block">
                {groupRankData.presentationCount > 0 || Number(groupRankData.average) > 0
                  ? `${groupRankData.average}%`
                  : '—'}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-center shadow-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Points</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5 block">
                {groupRankData.presentationCount > 0 || Number(groupRankData.total) > 0
                  ? `${groupRankData.total} pts`
                  : '—'}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-center shadow-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Latest Presentation</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-600 mt-0.5 block">
                {groupRankData.presentationCount > 0 || Number(groupRankData.latest) > 0
                  ? `${groupRankData.latest}%`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Leading Group Callout */}
          <div className="mt-3.5 p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <span className="text-base">🥇</span>
              <span>
                {groupRankData.leadingGroup ? (
                  <>
                    Leading: <strong className="text-slate-900 font-bold">{groupRankData.leadingGroup}</strong> (
                    {groupRankData.leadingScore}%)
                  </>
                ) : (
                  <span>Awaiting presentation grading</span>
                )}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider hidden sm:inline-block">
              {groupRankData.presentationCount} Presentation{groupRankData.presentationCount === 1 ? '' : 's'} Evaluated
            </span>
          </div>
        </div>
      )}

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
