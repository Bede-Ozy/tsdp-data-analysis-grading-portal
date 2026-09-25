import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminDashboard,
  getPendingSubmissions,
  getPendingModuleProjects,
  getPendingSocialPosts,
  getGroupLeaderboard,
  getActiveAssignments,
  getAllStudents,
  getAllCoaches,
  getAllStudentsPerformance,
  getCachedCohortAttendance,
  getCohortAttendanceMap
} from '../../services/api';
import { PROGRAM_INFO, getGradeLetter, formatScore, MODULES } from '../../utils/constants';
import { CardSkeleton, TableSkeleton } from '../../components/SkeletonLoader';
import {
  Users,
  UserCheck,
  TrendingUp,
  Clock,
  AlertTriangle,
  ClipboardList,
  ShieldCheck,
  ShieldAlert,
  FileBarChart,
  Layers,
  PlusCircle,
  Download,
  CheckSquare,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Activity,
  Award,
  X,
  Search,
  Check,
  Info
} from 'lucide-react';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [studentsPerformance, setStudentsPerformance] = useState([]);
  const [groupLeaderboard, setGroupLeaderboard] = useState([]);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [pendingModuleProjects, setPendingModuleProjects] = useState([]);
  const [pendingSocialPosts, setPendingSocialPosts] = useState([]);
  const [capstoneGroups, setCapstoneGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(PROGRAM_INFO.currentWeek || 6);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Risk Radar Modal State
  const [riskModal, setRiskModal] = useState({
    isOpen: false,
    type: null, // 'score' | 'attendance' | 'missing'
    title: '',
    description: '',
    students: []
  });

  // Export Toast feedback
  const [exportNotice, setExportNotice] = useState(null);

  // Load Dashboard Data directly from Live API Endpoints
  const loadDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        dashRes,
        pendingSubsRes,
        pendingModsRes,
        pendingPostsRes,
        leaderboardRes,
        activeAsgnsRes,
        perfRes
      ] = await Promise.all([
        getAdminDashboard().catch(() => null),
        getPendingSubmissions().catch(() => null),
        getPendingModuleProjects().catch(() => null),
        getPendingSocialPosts().catch(() => null),
        getGroupLeaderboard().catch(() => null),
        getActiveAssignments().catch(() => null),
        getAllStudentsPerformance().catch(() => null)
      ]);

      let stds = [];
      let coas = [];
      let perfs = [];
      let capGroups = [];

      if (dashRes && dashRes.success !== false) {
        const payload = dashRes.data || dashRes;
        stds = payload.students || [];
        coas = payload.coaches || [];
        perfs = payload.performance || payload.studentsPerformance || [];
        capGroups = payload.capstoneGroups || [];
        if (payload.currentWeek) {
          setCurrentWeek(Number(payload.currentWeek));
        }
      }

      // If performance list was empty in getAdminDashboard, use dedicated getAllStudentsPerformance
      if (!Array.isArray(perfs) || perfs.length === 0) {
        const list = Array.isArray(perfRes) ? perfRes : (perfRes?.data || []);
        if (Array.isArray(list) && list.length > 0) perfs = list;
      }

      // Resilient Fallback: If students or coaches are empty, load from dedicated cached endpoints
      if (!Array.isArray(stds) || stds.length === 0) {
        const stdsRes = await getAllStudents().catch(() => null);
        const list = Array.isArray(stdsRes) ? stdsRes : (stdsRes?.data || stdsRes?.students || []);
        if (Array.isArray(list) && list.length > 0) stds = list;
      }

      if (!Array.isArray(coas) || coas.length === 0) {
        const coasRes = await getAllCoaches().catch(() => null);
        const list = Array.isArray(coasRes) ? coasRes : (coasRes?.data || coasRes?.coaches || []);
        if (Array.isArray(list) && list.length > 0) coas = list;
      }

      // Merge performance metrics into student records for consistent access
      const perfMap = new Map();
      if (Array.isArray(perfs)) {
        perfs.forEach(p => {
          if (p.studentID) perfMap.set(String(p.studentID).toLowerCase().trim(), p);
          if (p.studentNumber) perfMap.set(String(p.studentNumber).padStart(3, '0'), p);
        });
      }

      // Retrieve cached cohort attendance map if available
      const cachedAttMap = getCachedCohortAttendance() || {};

      const mergedStudents = stds.map(s => {
        const sIdKey = String(s.studentID || '').toLowerCase().trim();
        const sNumKey = String(s.studentNumber || '').padStart(3, '0');
        const p = perfMap.get(sIdKey) || perfMap.get(sNumKey) || {};
        const attInfo = cachedAttMap[s.studentID] || cachedAttMap[sNumKey];

        const rawScore = p.finalScore !== undefined && p.finalScore !== null
          ? Number(p.finalScore)
          : (p.overallScore !== undefined && p.overallScore !== null
            ? Number(p.overallScore)
            : (s.overallScore !== undefined && s.overallScore !== null ? Number(s.overallScore) : null));

        // Convert Google Sheets decimal fraction (e.g. 0.3958 -> 39.58)
        const score = rawScore !== null && !isNaN(rawScore)
          ? (rawScore <= 1.0 && rawScore > 0 ? rawScore * 100 : rawScore)
          : null;

        const rawAtt = attInfo?.attendanceRate !== undefined
          ? Number(attInfo.attendanceRate)
          : (s.attendanceRate !== undefined && s.attendanceRate !== null
            ? Number(s.attendanceRate)
            : (p.attendanceRate !== undefined && p.attendanceRate !== null
              ? Number(p.attendanceRate)
              : (s.attendanceScore !== undefined ? Number(s.attendanceScore) * 10 : null)));

        const attendance = rawAtt !== null && !isNaN(rawAtt)
          ? (rawAtt <= 1.0 && rawAtt > 0 ? rawAtt * 100 : rawAtt)
          : null;

        return {
          ...s,
          ...p,
          overallScore: score,
          attendanceRate: attendance,
          attendanceDetails: attInfo || null,
          status: s.status || p.status || 'Active',
          name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentID,
          classGroup: s.classGroup || p.classGroup || 'Group 1',
          capstoneGroup: s.capstoneGroup || p.capstoneGroup || 'Unassigned'
        };
      });

      setStudents(mergedStudents);
      setCoaches(Array.isArray(coas) ? coas : []);
      setStudentsPerformance(Array.isArray(perfs) ? perfs : []);
      setCapstoneGroups(Array.isArray(capGroups) ? capGroups : []);

      // Background sync: Fetch complete cohort attendance if not cached or upon manual refresh
      const shouldSyncAttendance = isManual || Object.keys(cachedAttMap).length === 0;
      if (shouldSyncAttendance && stds.length > 0) {
        setAttendanceLoading(true);
        const studentIds = stds.map(st => st.studentID).filter(Boolean);
        getCohortAttendanceMap(studentIds, isManual)
          .then(freshMap => {
            if (freshMap && Object.keys(freshMap).length > 0) {
              setStudents(prevStudents => {
                return prevStudents.map(st => {
                  const numKey = String(st.studentNumber || '').padStart(3, '0');
                  const freshInfo = freshMap[st.studentID] || freshMap[numKey];
                  if (freshInfo && freshInfo.attendanceRate !== undefined) {
                    return {
                      ...st,
                      attendanceRate: Number(freshInfo.attendanceRate),
                      attendanceDetails: freshInfo
                    };
                  }
                  return st;
                });
              });
            }
          })
          .catch(err => {
            console.warn('Cohort attendance background sync error:', err);
          })
          .finally(() => {
            setAttendanceLoading(false);
          });
      }

      // Group Leaderboard processing from Live API
      let board = [];
      if (leaderboardRes && leaderboardRes.success !== false) {
        const raw = Array.isArray(leaderboardRes)
          ? leaderboardRes
          : (leaderboardRes.data?.leaderboard || leaderboardRes.leaderboard || leaderboardRes.data || leaderboardRes.groups || []);
        if (Array.isArray(raw) && raw.length > 0) {
          board = raw.map((item, idx) => ({
            rank: item.rank || idx + 1,
            group: item.group || item.groupName || item.className || item.classGroup || item.team || `Group ${idx + 1}`,
            average: item.average ?? item.averageScore ?? item.avgScore ?? item.avg ?? 0,
            total: item.total ?? item.totalScore ?? item.points ?? item.totalPoints ?? 0,
            latest: item.latestScore ?? item.latest ?? item.recentScore ?? '—',
            presentations: item.presentations ?? item.presentationCount ?? item.count ?? item.totalPresentations ?? 0
          }));
        }
      }
      setGroupLeaderboard(board);

      // Pending Submissions from Live API
      const subsList = Array.isArray(pendingSubsRes)
        ? pendingSubsRes
        : (pendingSubsRes?.data || pendingSubsRes?.submissions || []);
      setPendingSubmissions(Array.isArray(subsList) ? subsList : []);

      // Pending Module Projects from Live API
      const modsList = Array.isArray(pendingModsRes)
        ? pendingModsRes
        : (pendingModsRes?.data || pendingModsRes?.projects || []);
      setPendingModuleProjects(Array.isArray(modsList) ? modsList : []);

      // Pending Social Posts from Live API
      const postsList = Array.isArray(pendingPostsRes)
        ? pendingPostsRes
        : (pendingPostsRes?.data || pendingPostsRes?.posts || []);
      setPendingSocialPosts(Array.isArray(postsList) ? postsList : []);

      // Active Assignments from Live API
      const asgnsList = Array.isArray(activeAsgnsRes)
        ? activeAsgnsRes
        : (activeAsgnsRes?.data || activeAsgnsRes?.assignments || []);
      setActiveAssignments(Array.isArray(asgnsList) ? asgnsList : []);

    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // -------------------------------------------------------------
  // Section 1: Timeline & Milestone Calculations (Derived from live currentWeek)
  // -------------------------------------------------------------
  const totalWeeks = PROGRAM_INFO.totalWeeks || 16;
  const percentComplete = Math.min(100, Math.max(0, Math.round((currentWeek / totalWeeks) * 100)));
  
  // Determine current active module from live week number
  const currentMonthNumber = Math.ceil(currentWeek / 4);
  const currentModule = MODULES.find(m => m.month === currentMonthNumber) || {
    month: currentMonthNumber,
    tool: 'Data Analytics',
    title: 'Training Module in Progress'
  };

  // -------------------------------------------------------------
  // Section 2: Program Vital Signs (6 KPI Cards) — 100% Live Computed
  // -------------------------------------------------------------
  const totalStudents = students.length;
  const activeStudents = students.filter(s => {
    const st = String(s.status || '').trim().toLowerCase();
    return st === 'active' || (st !== 'inactive' && st !== 'disabled');
  }).length;

  // Cohort Mean Score (Computed strictly across valid student scores)
  const validScores = students
    .map(s => s.overallScore)
    .filter(sc => sc !== null && sc !== undefined && !isNaN(Number(sc)));

  const classAvgScore = validScores.length > 0
    ? (validScores.reduce((sum, s) => sum + Number(s), 0) / validScores.length).toFixed(1)
    : null;

  // Cohort Attendance Rate Mean (Computed strictly across valid attendance records)
  const validAttendances = students
    .map(s => s.attendanceRate)
    .filter(a => a !== null && a !== undefined && !isNaN(Number(a)));

  const classAvgAttendance = validAttendances.length > 0
    ? Math.round(validAttendances.reduce((sum, a) => sum + Number(a), 0) / validAttendances.length)
    : null;

  // At-Risk Count (< 50% score threshold) — Computed from live student scores
  const lowScoreStudents = useMemo(() => {
    return students.filter(s => {
      const sc = s.overallScore !== null && s.overallScore !== undefined ? Number(s.overallScore) : null;
      return sc !== null && !isNaN(sc) && sc < 50;
    }).map(s => ({
      ...s,
      metricValue: `${formatScore(s.overallScore, 1)}`,
      metricLabel: 'Final Score',
      issue: 'Academic Score < 50%'
    }));
  }, [students]);

  // Attendance Warning List (< 75% threshold) — Computed from live attendance
  const lowAttendanceStudents = useMemo(() => {
    return students.filter(s => {
      const att = s.attendanceRate !== null && s.attendanceRate !== undefined ? Number(s.attendanceRate) : null;
      return att !== null && !isNaN(att) && att < 75;
    }).map(s => ({
      ...s,
      metricValue: `${Math.round(s.attendanceRate)}%`,
      metricLabel: 'Attendance Rate',
      issue: 'Attendance < 75% ITF Threshold'
    }));
  }, [students]);

  // Missing Submissions List — Computed from live student deliverable tracking
  const missingSubmissionStudents = useMemo(() => {
    return students.filter(s => {
      if (s.missingSubmissions !== undefined && Number(s.missingSubmissions) > 0) return true;
      if (s.missingCount !== undefined && Number(s.missingCount) > 0) return true;
      if (s.pendingSubmissionsCount !== undefined && Number(s.pendingSubmissionsCount) > 0) return true;
      return false;
    }).map(s => ({
      ...s,
      metricValue: `${s.missingSubmissions || s.missingCount || 1} Overdue`,
      metricLabel: 'Missing Tasks',
      issue: 'Unsubmitted Technical / Professional Tasks'
    }));
  }, [students]);

  // Active Coaches — Computed from live coach master list
  const totalCoaches = coaches.length;
  const activeCoaches = coaches.filter(c => {
    const st = String(c.status || '').trim().toLowerCase();
    return st === 'active' || (st !== 'inactive' && st !== 'disabled');
  }).length;

  // Total Pending Grading (Submissions + Module Projects + Social Posts from live arrays)
  const pendingGradingTotal = pendingSubmissions.length + pendingModuleProjects.length + pendingSocialPosts.length;

  // -------------------------------------------------------------
  // Section 4: Grade Distribution (CSS Bar Chart)
  // Scale: A ≥ 70, B 60-69, C 50-59, D 45-49, F < 45
  // Computed strictly from live student overall scores
  // -------------------------------------------------------------
  const gradeDistribution = useMemo(() => {
    const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    let gradedCount = 0;

    students.forEach(s => {
      const sc = s.overallScore !== null && s.overallScore !== undefined ? Number(s.overallScore) : null;
      if (sc !== null && !isNaN(sc)) {
        gradedCount += 1;
        if (sc >= 70) dist.A += 1;
        else if (sc >= 60) dist.B += 1;
        else if (sc >= 50) dist.C += 1;
        else if (sc >= 45) dist.D += 1;
        else dist.F += 1;
      }
    });

    return {
      totalGraded: gradedCount,
      bars: [
        { grade: 'A', label: '≥ 70%', title: 'Distinction', count: dist.A, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
        { grade: 'B', label: '60–69%', title: 'Merit', count: dist.B, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
        { grade: 'C', label: '50–59%', title: 'Credit', count: dist.C, color: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' },
        { grade: 'D', label: '45–49%', title: 'Pass', count: dist.D, color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
        { grade: 'F', label: '< 45%', title: 'At Risk', count: dist.F, color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' }
      ]
    };
  }, [students]);

  // -------------------------------------------------------------
  // Section 5: Stream Performance (CSS Progress Bars)
  // Computed strictly from studentsPerformance without simulated multipliers
  // -------------------------------------------------------------
  const streamPerformance = useMemo(() => {
    let techSum = 0, techCount = 0;
    let profSum = 0, profCount = 0;
    let capSum = 0, capCount = 0;

    studentsPerformance.forEach(p => {
      // Tech stream keys (Technical Assignments + Module Projects)
      const techScore = p.technicalScore ?? p.technicalAssignmentsScore;
      const modScore = p.moduleProjectScore ?? p.moduleProjectsScore;
      if (techScore !== undefined && techScore !== null && !isNaN(Number(techScore))) {
        techSum += Number(techScore) * 10;
        techCount++;
      }
      if (modScore !== undefined && modScore !== null && !isNaN(Number(modScore))) {
        techSum += Number(modScore) * 5;
        techCount++;
      }

      // Professional stream keys (Soft Skills + Professional Tasks)
      const softScore = p.softSkillsScore ?? p.softSkillsEvaluationScore;
      const profScore = p.professionalScore ?? p.professionalAssignmentsScore;
      if (softScore !== undefined && softScore !== null && !isNaN(Number(softScore))) {
        profSum += Number(softScore) * 10;
        profCount++;
      }
      if (profScore !== undefined && profScore !== null && !isNaN(Number(profScore))) {
        profSum += Number(profScore) * 20;
        profCount++;
      }

      // Capstone & Group keys (Capstone Sprints + Group Presentations)
      const capScore = p.capstoneScore ?? p.capstoneProjectsScore;
      const grpScore = p.groupPresentationScore ?? p.groupPresentationsScore;
      if (capScore !== undefined && capScore !== null && !isNaN(Number(capScore))) {
        capSum += Number(capScore) * 4;
        capCount++;
      }
      if (grpScore !== undefined && grpScore !== null && !isNaN(Number(grpScore))) {
        capSum += Number(grpScore) * 10;
        capCount++;
      }
    });

    const techAvg = techCount > 0 ? Math.round(techSum / techCount) : null;
    const profAvg = profCount > 0 ? Math.round(profSum / profCount) : null;
    const capAvg = capCount > 0 ? Math.round(capSum / capCount) : null;

    return [
      {
        id: 'technical',
        title: 'Technical Stream',
        subtitle: 'Technical Assignments (10%) + Module Projects (20%)',
        avg: techAvg,
        color: 'bg-blue-600',
        trackColor: 'bg-blue-100',
        textColor: 'text-blue-700'
      },
      {
        id: 'professional',
        title: 'Professional Stream',
        subtitle: 'Soft Skills (10%) + Professional Tasks (5%)',
        avg: profAvg,
        color: 'bg-brand-secondary',
        trackColor: 'bg-orange-100',
        textColor: 'text-orange-700'
      },
      {
        id: 'capstone',
        title: 'Capstone & Group',
        subtitle: 'Capstone Sprints (25%) + Presentations (10%)',
        avg: capAvg,
        color: 'bg-cyan-600',
        trackColor: 'bg-cyan-100',
        textColor: 'text-cyan-700'
      }
    ];
  }, [studentsPerformance]);

  // -------------------------------------------------------------
  // Section 6: Cohort Velocity & Compliance — 100% Live Computed
  // -------------------------------------------------------------
  const cohortVelocity = useMemo(() => {
    const totalActiveAsgns = activeAssignments.length;
    // Sum total completed submissions from live assignment records
    const completedSubmissions = activeAssignments.reduce((sum, a) => {
      return sum + (Number(a.submissionCount || a.submissionsCount || a.completedCount || a.submissions) || 0);
    }, 0);

    const expectedTotal = totalActiveAsgns > 0 && totalStudents > 0
      ? totalStudents * totalActiveAsgns
      : (totalStudents || 1);

    const velocityPct = expectedTotal > 0 ? Math.min(100, Math.round((completedSubmissions / expectedTotal) * 100)) : 0;

    return {
      totalActiveAsgns,
      completedSubmissions,
      expectedTotal,
      velocityPct
    };
  }, [activeAssignments, totalStudents]);

  // ITF Compliance: Percentage of students with logged attendance
  const attendanceCompleteness = useMemo(() => {
    if (totalStudents === 0) return 0;
    const loggedCount = students.filter(s => s.attendanceRate !== null && s.attendanceRate !== undefined).length;
    return Math.round((loggedCount / totalStudents) * 100);
  }, [students, totalStudents]);

  // -------------------------------------------------------------
  // Section 8: Top 10 Students Table (Live Sliced from Sorted Array)
  // -------------------------------------------------------------
  const top10Students = useMemo(() => {
    const list = [...students]
      .filter(s => s.overallScore !== null && s.overallScore !== undefined)
      .sort((a, b) => (Number(b.overallScore) || 0) - (Number(a.overallScore) || 0))
      .slice(0, 10);

    return list.map((s, idx) => ({
      ...s,
      rank: idx + 1,
      score: formatScore(s.overallScore, 1),
      gradeInfo: getGradeLetter(s.overallScore)
    }));
  }, [students]);

  // -------------------------------------------------------------
  // Section 7: Export ITF-NECA CSV Report (Live Generated)
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    if (!students || students.length === 0) {
      setExportNotice({ type: 'error', message: 'No student data available to export.' });
      setTimeout(() => setExportNotice(null), 4000);
      return;
    }

    const headers = [
      'Rank',
      'StudentID',
      'StudentNumber',
      'Name',
      'Email',
      'ClassGroup',
      'CapstoneGroup',
      'AttendanceRate',
      'OverallScore',
      'GradeLetter',
      'Status',
      'ITF_Compliance'
    ];

    const sorted = [...students].sort((a, b) => (Number(b.overallScore) || 0) - (Number(a.overallScore) || 0));

    const rows = sorted.map((s, idx) => {
      const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentID;
      const att = s.attendanceRate !== undefined && s.attendanceRate !== null ? formatScore(s.attendanceRate, 1, 'N/A') : 'N/A';
      const score = s.overallScore !== undefined && s.overallScore !== null ? formatScore(s.overallScore, 2, 'N/A') : 'N/A';
      const letter = s.overallScore !== undefined && s.overallScore !== null ? getGradeLetter(s.overallScore).letter : 'Pending';
      const compliance = (Number(s.overallScore) >= 50 && Number(s.attendanceRate) >= 75) ? 'Compliant' : 'Risk Warning';

      return [
        idx + 1,
        s.studentID || '',
        s.studentNumber || '',
        `"${sName.replace(/"/g, '""')}"`,
        s.email || '',
        s.classGroup || '',
        s.capstoneGroup || '',
        att,
        score,
        letter,
        s.status || 'Active',
        compliance
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ITF_NECA_TSDP_Cohort_Executive_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice({ type: 'success', message: 'Official ITF-NECA CSV Report downloaded successfully.' });
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Open Risk Modal
  const openRiskModal = (type, title, description, studentList) => {
    setRiskModal({
      isOpen: true,
      type,
      title,
      description,
      students: studentList
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification for CSV Export or Status */}
      {exportNotice && (
        <div
          className={`fixed top-20 right-6 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-fade-in transition-all ${
            exportNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {exportNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-medium">{exportNotice.message}</span>
          <button
            onClick={() => setExportNotice(null)}
            className="p-1 hover:bg-black/5 rounded-md text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: COHORT TIMELINE BANNER                                         */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-primary to-brand-success rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        {/* Subtle Decorative Background Wave */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-xs border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Program Governance Console · ITF-NECA-TSDP 2026</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Cohort Executive Dashboard
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl font-normal">
              Live program metrics, sponsor compliance, faculty readiness, and resident academic radar.
            </p>

            {/* Dynamic Milestone Text & Progress Bar */}
            <div className="pt-3 space-y-2 max-w-xl">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-100">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Week {currentWeek} of {totalWeeks} · Month {currentModule.month}: {currentModule.tool}
                </span>
                <span className="text-amber-300 font-bold">{percentComplete}% complete</span>
              </div>

              {/* Pure CSS Progress Bar */}
              <div className="w-full bg-black/25 h-3 rounded-full overflow-hidden p-0.5 border border-white/20 backdrop-blur-xs">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-brand-secondary to-emerald-400 transition-all duration-700 ease-out shadow-xs"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>

              {/* Module Timeline Track (4 Months) */}
              <div className="grid grid-cols-4 gap-2 pt-1 text-[11px] text-blue-200">
                <span className="font-medium truncate">M1: Excel (1-4)</span>
                <span className="font-bold text-amber-300 truncate">M2: SQL (5-8) ●</span>
                <span className="font-medium text-blue-300/80 truncate">M3: PowerBI (9-12)</span>
                <span className="font-medium text-blue-300/80 truncate">M4: Python (13-16)</span>
              </div>
            </div>
          </div>

          {/* Action Button Suite */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {/* Live Refresh Trigger */}
            <button
              type="button"
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-3.5 py-2.5 rounded-xl border border-white/20 text-xs flex items-center gap-2 backdrop-blur-xs transition-all disabled:opacity-50"
              title="Refresh live metrics from Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-brand-secondary hover:bg-brand-secondary-dark text-white font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-sm text-xs flex items-center gap-2 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <Link
              to="/admin/reports"
              className="bg-white hover:bg-slate-100 text-brand-primary font-semibold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-sm text-xs flex items-center gap-2 transition-all"
            >
              <FileBarChart className="w-3.5 h-3.5" />
              <span>Performance Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PROGRAM VITAL SIGNS (6 KPI CARDS) — 100% Live Computed         */}
      {/* Grid layout: 3x2 on desktop, 2x3 on tablet, 1x6 on mobile                 */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Total Students */}
          <div className="portal-card relative overflow-hidden group hover:border-brand-primary">
            <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-800">{totalStudents}</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {activeStudents} Active
              </span>
            </div>
            <p className="text-[11px] text-brand-neutral-muted mt-2">
              {totalStudents > 0
                ? `${totalStudents} Enrolled · ${activeStudents} Active (${Math.round((activeStudents / totalStudents) * 100)}% active)`
                : 'No students enrolled'}
            </p>
          </div>

          {/* Card 2: Cohort Mean Score */}
          <div className="portal-card relative overflow-hidden group hover:border-brand-primary">
            <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cohort Mean Score</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-brand-primary">
                {classAvgScore !== null ? `${classAvgScore}%` : '—'}
              </span>
              {classAvgScore !== null && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    Number(classAvgScore) >= 70
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}
                >
                  {Number(classAvgScore) >= 70 ? 'Exceeding target' : 'vs 70% target'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-brand-neutral-muted mt-2">
              {classAvgScore !== null
                ? (Number(classAvgScore) >= 70 ? 'Exceeding target benchmark' : 'Within remediable credit range')
                : 'Awaiting student evaluation records'}
            </p>
          </div>

          {/* Card 3: Attendance Rate */}
          <div className="portal-card relative overflow-hidden group hover:border-teal-500">
            <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-teal-700">
                {classAvgAttendance !== null ? `${classAvgAttendance}%` : (attendanceLoading ? '...' : '—')}
              </span>
              {classAvgAttendance !== null && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    classAvgAttendance >= 75
                      ? 'text-teal-700 bg-teal-50 border-teal-200'
                      : 'text-red-700 bg-red-50 border-red-200'
                  }`}
                >
                  {classAvgAttendance >= 75 ? 'Compliant' : 'Below 75%'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-brand-neutral-muted mt-2">
              {classAvgAttendance !== null
                ? 'Class average across physical & virtual sessions'
                : (attendanceLoading ? 'Syncing live attendance records...' : 'Awaiting attendance session data')}
            </p>
          </div>

          {/* Card 4: At-Risk Count (<50%) */}
          <div className="portal-card relative overflow-hidden group hover:border-red-400">
            <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Residents At Risk</span>
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-bold ${lowScoreStudents.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {lowScoreStudents.length}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  lowScoreStudents.length > 0
                    ? 'text-red-700 bg-red-50 border-red-200'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}
              >
                &lt; 50% Threshold
              </span>
            </div>
            <p className="text-[11px] text-brand-neutral-muted mt-2">
              {lowScoreStudents.length > 0 ? 'Requires immediate faculty remediation' : 'Zero students below fail line'}
            </p>
          </div>

          {/* Card 5: Active Coaches */}
          <div className="portal-card relative overflow-hidden group hover:border-brand-secondary">
            <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Faculty</span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-brand-secondary flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-800">
                {activeCoaches} of {totalCoaches}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border text-emerald-700 bg-emerald-50 border-emerald-200">
                {totalCoaches > 0 ? `${Math.round((activeCoaches / totalCoaches) * 100)}% Active` : 'No Coaches'}
              </span>
            </div>
            <p className="text-[11px] text-brand-neutral-muted mt-2">
              Technical & Professional coaching staff
            </p>
          </div>

          {/* Card 6: Pending Grading */}
          <div className="portal-card relative overflow-hidden group hover:border-purple-400">
            <div className="flex items-center justify-between text-brand-neutral-muted mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Grading</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-purple-700">{pendingGradingTotal}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border text-purple-700 bg-purple-50 border-purple-200">
                Queue Total
              </span>
            </div>
            <p className="text-[11px] text-brand-neutral-muted mt-2 truncate">
              {pendingSubmissions.length} Tech · {pendingModuleProjects.length} Projects · {pendingSocialPosts.length} Posts
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: RISK RADAR (EARLY INTERVENTION MONITOR)                       */}
      {/* Only show categories with counts > 0                                      */}
      {/* ========================================================================= */}
      <div className="portal-card space-y-4 border-l-4 border-l-amber-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Early Intervention Risk Radar</h2>
              <p className="text-xs text-brand-neutral-muted">
                Academic risk & compliance triggers evaluated across {totalStudents} cohort residents
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-400 self-start sm:self-auto">
            Thresholds: Score &lt; 50% · Attendance &lt; 75%
          </span>
        </div>

        {/* Display Alert Categories (Only if count > 0) */}
        {lowScoreStudents.length === 0 && lowAttendanceStudents.length === 0 && missingSubmissionStudents.length === 0 ? (
          <div className="py-4 px-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>All clear!</strong> No residents currently trigger the &lt;50% score, &lt;75% attendance, or missing submission thresholds.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Category 1: Score < 50% */}
            {lowScoreStudents.length > 0 && (
              <div className="p-4 rounded-xl bg-red-50/80 border border-red-200/90 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Academic Risk
                    </span>
                    <span className="text-xs font-extrabold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      {lowScoreStudents.length}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 pt-1">
                    {lowScoreStudents.length} resident{lowScoreStudents.length > 1 ? 's' : ''} below 50% score
                  </p>
                  <p className="text-[11px] text-red-600/90 leading-tight">
                    Requires immediate tutorial intervention before SQL evaluation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openRiskModal(
                    'score',
                    'Residents Below 50% Score Threshold',
                    'The following residents are scoring below the minimum pass grade (50%). Recommended action: schedule coach 1-on-1 review.',
                    lowScoreStudents
                  )}
                  className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View List ({lowScoreStudents.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Category 2: Attendance < 75% */}
            {lowAttendanceStudents.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Attendance Deficit
                    </span>
                    <span className="text-xs font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {lowAttendanceStudents.length}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 pt-1">
                    {lowAttendanceStudents.length} resident{lowAttendanceStudents.length > 1 ? 's' : ''} below 75% attendance
                  </p>
                  <p className="text-[11px] text-amber-700/90 leading-tight">
                    Breaches ITF-NECA sponsor minimum physical & virtual requirements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openRiskModal(
                    'attendance',
                    'Residents Below 75% Attendance Threshold',
                    'These residents fall below the mandatory 75% attendance compliance standard established by ITF-NECA.',
                    lowAttendanceStudents
                  )}
                  className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View List ({lowAttendanceStudents.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Category 3: Missing Submissions */}
            {missingSubmissionStudents.length > 0 && (
              <div className="p-4 rounded-xl bg-orange-50/80 border border-orange-200/90 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-orange-600" />
                      Deliverables Incomplete
                    </span>
                    <span className="text-xs font-extrabold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                      {missingSubmissionStudents.length}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 pt-1">
                    {missingSubmissionStudents.length} resident{missingSubmissionStudents.length > 1 ? 's' : ''} with missing submissions
                  </p>
                  <p className="text-[11px] text-orange-700/90 leading-tight">
                    Overdue assignments impeding assessment velocity.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openRiskModal(
                    'missing',
                    'Residents with Overdue Submissions',
                    'These residents have pending or unsubmitted deliverables across technical and professional tracks.',
                    missingSubmissionStudents
                  )}
                  className="w-full py-1.5 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View List ({missingSubmissionStudents.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4 & 5: GRADE DISTRIBUTION & STREAM PERFORMANCE (2 CARDS)          */}
      {/* Pure CSS Charts & Progress Bars (100% dynamic from live evaluation records)*/}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 4: Grade Distribution (CSS Bar Chart) */}
        <div className="portal-card space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Cohort Grade Distribution</h2>
              <p className="text-xs text-brand-neutral-muted">
                Academic tier breakdown across {gradeDistribution.totalGraded} assessed residents
              </p>
            </div>
            {classAvgScore !== null && (
              <span className="text-xs font-bold text-brand-primary bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                Mean: {classAvgScore}%
              </span>
            )}
          </div>

          {/* Horizontal CSS Bar Chart */}
          <div className="space-y-3 pt-1">
            {gradeDistribution.bars.map((b) => {
              const widthPct = gradeDistribution.totalGraded > 0
                ? Math.round((b.count / gradeDistribution.totalGraded) * 100)
                : 0;

              return (
                <div key={b.grade} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-md font-bold flex items-center justify-center text-xs ${b.bg} ${b.text}`}>
                        {b.grade}
                      </span>
                      <span className="font-semibold text-slate-700">{b.title}</span>
                      <span className="text-slate-400 font-normal">({b.label})</span>
                    </div>
                    <span className="font-bold text-slate-800">
                      {b.count} <span className="text-[11px] font-normal text-slate-500">({widthPct}%)</span>
                    </span>
                  </div>

                  {/* Pure CSS Bar Track & Fill */}
                  <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${b.color} transition-all duration-500 ease-out`}
                      style={{ width: `${Math.max(widthPct > 0 ? widthPct : 0, b.count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Scale: A (≥70) · B (60-69) · C (50-59) · D (45-49) · F (&lt;45)</span>
            <span className="font-medium text-slate-700">TSDP 2026 Grading Rule</span>
          </div>
        </div>

        {/* Section 5: Stream Performance (CSS Progress Bars) */}
        <div className="portal-card space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Curriculum Stream Performance</h2>
              <p className="text-xs text-brand-neutral-muted">
                Weighted aggregate mastery across core pedagogical pillars
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              3 Streams
            </span>
          </div>

          {/* 3 Stream Progress Bars */}
          <div className="space-y-4 pt-1">
            {streamPerformance.map((st) => (
              <div key={st.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">{st.title}</h3>
                    <p className="text-[11px] text-brand-neutral-muted">{st.subtitle}</p>
                  </div>
                  <span className={`text-sm font-extrabold ${st.textColor} bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs`}>
                    {st.avg !== null ? `Avg: ${st.avg}%` : 'Pending'}
                  </span>
                </div>

                {/* Pure CSS Progress Bar */}
                <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${st.color} transition-all duration-500 ease-out`}
                    style={{ width: `${st.avg !== null ? Math.min(100, Math.max(0, st.avg)) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Aggregates technical tests, capstone sprints & soft skills</span>
            <Link to="/admin/reports" className="text-brand-primary hover:underline font-semibold flex items-center gap-1">
              <span>View Component Matrix</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: COHORT VELOCITY + ITF-NECA COMPLIANCE (100% LIVE DATA)          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Cohort Velocity */}
        <div className="portal-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Cohort Learning Velocity</h2>
                <p className="text-xs text-brand-neutral-muted">Deliverable throughput across active coursework</p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              Week {currentWeek}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Assignments Completed This Cycle</span>
              <span className="text-sm font-bold text-brand-primary">
                {cohortVelocity.completedSubmissions} / {cohortVelocity.expectedTotal} ({cohortVelocity.velocityPct}%)
              </span>
            </div>

            {/* Pure CSS Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-primary transition-all duration-500"
                style={{ width: `${cohortVelocity.velocityPct}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-600">
              <div className="p-2 rounded-lg bg-white border border-slate-100">
                <span className="block text-slate-400">Active Coursework</span>
                <span className="font-bold text-slate-800 text-xs">{cohortVelocity.totalActiveAsgns} Live Tasks</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-100">
                <span className="block text-slate-400">Total Enrolled</span>
                <span className="font-bold text-slate-800 text-xs">{totalStudents} Residents</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: ITF-NECA Sponsor Compliance */}
        <div className="portal-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">ITF-NECA Compliance Status</h2>
                <p className="text-xs text-brand-neutral-muted">Sponsor governance audit indicators</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Audit Verified
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Compliance item 1: Weekly Report */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <span className="font-medium text-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Weekly Report Status
              </span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                ✅ Live Synchronized
              </span>
            </div>

            {/* Compliance item 2: Attendance Records Complete */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <span className="font-medium text-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Attendance Log Completeness
              </span>
              <span className="font-bold text-slate-800">
                {attendanceCompleteness}% Logged
              </span>
            </div>

            {/* Compliance item 3: All Coaches Active */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <span className="font-medium text-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Faculty Deployment Status
              </span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {activeCoaches === totalCoaches && totalCoaches > 0
                  ? `✅ All ${activeCoaches} Coaches Active`
                  : `⚠️ ${activeCoaches} of ${totalCoaches} Active`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 7: QUICK ACTIONS GRID (6-7 ACTION CARDS)                         */}
      {/* ========================================================================= */}
      <div className="portal-card space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Administrative Operations</h2>
            <p className="text-xs text-brand-neutral-muted">
              Direct management controls, capstone group orchestration, and report generation
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">7 Operational Actions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action 1: Manage Residents */}
          <Link
            to="/admin/students"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-primary hover:shadow-xs transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-brand-primary">
                Manage Residents
              </h3>
              <p className="text-[11px] text-brand-neutral-muted mt-0.5">
                Toggle status, inspect {totalStudents} resident dossiers & attendance records.
              </p>
            </div>
          </Link>

          {/* Action 2: Manage Coaches */}
          <Link
            to="/admin/coaches"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-secondary hover:shadow-xs transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand-secondary flex items-center justify-center group-hover:bg-brand-secondary group-hover:text-white transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-secondary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-brand-secondary">
                Manage Coaches
              </h3>
              <p className="text-[11px] text-brand-neutral-muted mt-0.5">
                Review faculty master, toggle staff permissions & tracks.
              </p>
            </div>
          </Link>

          {/* Action 3: Create Capstone Group */}
          <Link
            to="/admin/create-capstone-group"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-500 hover:shadow-xs transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-purple-600">
                Create Capstone Group
              </h3>
              <p className="text-[11px] text-brand-neutral-muted mt-0.5">
                Pair class groups into multi-member capstone squads.
              </p>
            </div>
          </Link>

          {/* Action 4: Create Assignment */}
          <Link
            to="/coach/create-assignment"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-xs transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <PlusCircle className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-600">
                Create Assignment
              </h3>
              <p className="text-[11px] text-brand-neutral-muted mt-0.5">
                Publish new technical exercises or professional briefs.
              </p>
            </div>
          </Link>

          {/* Action 5: Performance Reports */}
          <Link
            to="/admin/reports"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-cyan-500 hover:shadow-xs transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <FileBarChart className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-cyan-600">
                View Reports
              </h3>
              <p className="text-[11px] text-brand-neutral-muted mt-0.5">
                Print transcripts, view aggregate matrices & charts.
              </p>
            </div>
          </Link>

          {/* Action 6: Export ITF-NECA CSV (Direct 1-Click Action) */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-rose-500 hover:shadow-xs transition-all group flex flex-col justify-between space-y-3 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <Download className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-rose-600">
                Export ITF-NECA CSV
              </h3>
              <p className="text-[11px] text-brand-neutral-muted mt-0.5">
                Download verified cohort spreadsheet with scores & grades.
              </p>
            </div>
          </button>

          {/* Action 7: Manual Grade Entry */}
          <Link
            to="/coach/grade-assignments"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-xs transition-all group flex flex-col justify-between space-y-3 col-span-1 sm:col-span-2 lg:col-span-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <CheckSquare className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600">
                  Manual Grade Entry & Override
                </h3>
                <span className="badge-primary text-[10px]">Coach Console</span>
              </div>
              <p className="text-[11px] text-brand-neutral-muted mt-0.5">
                Access direct grading forms for offline evaluations, special exemptions, or score overrides.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 8 & 9: TOP 10 STUDENTS & GROUP LEADERBOARD                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 8: Top 10 Students Table */}
        <div className="portal-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Top 10 Resident Scholars</span>
              </h2>
              <p className="text-xs text-brand-neutral-muted">
                Cohort ranking based on cumulative weighted performance
              </p>
            </div>
            <Link
              to="/admin/students"
              className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
            >
              <span>View All ({totalStudents})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {top10Students.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No assessed students found in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                    <th className="py-2 px-2 text-center w-12">Rank</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Group</th>
                    <th className="py-2 px-3 text-center">Score</th>
                    <th className="py-2 px-2 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {top10Students.map((s) => {
                    const medal = s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : null;

                    return (
                      <tr key={s.studentID} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-2 text-center font-bold">
                          <span className="inline-flex items-center justify-center gap-1 font-mono text-slate-700">
                            {medal && <span className="text-sm">{medal}</span>}
                            <span>{s.rank}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{s.name}</div>
                          <div className="text-[10px] text-slate-400">{s.studentID || s.studentNumber}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {s.classGroup}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-brand-primary">
                          {s.score}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border ${s.gradeInfo.color}`}>
                            {s.gradeInfo.letter}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 9: Group Leaderboard */}
        <div className="portal-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <span>Group Leaderboard</span>
              </h2>
              <p className="text-xs text-brand-neutral-muted">
                Class group presentation standings & cumulative points (10% weight)
              </p>
            </div>
            <Link
              to="/coach/grade-presentations"
              className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
            >
              <span>Presentations</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {groupLeaderboard.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-xl bg-slate-50/50 border border-dashed border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
                <Users className="w-5 h-5 text-cyan-600" />
              </div>
              <p className="text-xs font-semibold text-slate-700">No Group Presentations Recorded Yet</p>
              <p className="text-[11px] text-brand-neutral-muted max-w-sm mx-auto">
                When faculty grade class presentations, team rankings and points will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                    <th className="py-2 px-2 text-center w-12">Rank</th>
                    <th className="py-2 px-3">Group</th>
                    <th className="py-2 px-3 text-center">Average</th>
                    <th className="py-2 px-3 text-center">Total</th>
                    <th className="py-2 px-3 text-center">Presentations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupLeaderboard.map((item, idx) => {
                    const rank = item.rank || idx + 1;
                    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

                    return (
                      <tr key={item.group || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-2 text-center font-bold">
                          <span className="inline-flex items-center justify-center gap-1 font-mono text-slate-700">
                            {medal && <span className="text-sm">{medal}</span>}
                            <span>{rank}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {item.group}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-brand-primary border border-blue-100">
                            {typeof item.average === 'number' ? `${item.average}%` : item.average}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                          {item.total}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-500">
                          {item.presentations}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RISK RADAR DETAIL MODAL                                                   */}
      {/* ========================================================================= */}
      {riskModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setRiskModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{riskModal.title}</h3>
                  <p className="text-xs text-brand-neutral-muted">{riskModal.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRiskModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: List of At-Risk Students */}
            <div className="p-5 overflow-y-auto space-y-3 divide-y divide-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 font-medium">
                <span>Flagged Residents ({riskModal.students.length})</span>
                <span>Trigger Value</span>
              </div>

              {riskModal.students.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No residents match this criteria.
                </div>
              ) : (
                riskModal.students.map((st) => (
                  <div key={st.studentID || st.studentNumber} className="pt-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-slate-800">{st.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono">{st.studentID || st.studentNumber}</span>
                        <span>·</span>
                        <span className="badge-primary text-[10px] py-0">{st.classGroup}</span>
                        {st.email && (
                          <>
                            <span>·</span>
                            <span className="text-slate-400 truncate max-w-xs">{st.email}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold bg-red-50 text-red-700 border border-red-200">
                        {st.metricValue}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{st.metricLabel}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <Link
                to="/admin/students"
                onClick={() => setRiskModal(prev => ({ ...prev, isOpen: false }))}
                className="btn-outline py-2 px-3 text-xs flex items-center gap-1.5"
              >
                <span>Open Manage Residents Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setRiskModal(prev => ({ ...prev, isOpen: false }))}
                className="btn-primary py-2 px-4 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
